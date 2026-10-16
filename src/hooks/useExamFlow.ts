/**
 * useExamFlow.ts
 * React hook orchestrating the complete IELTS Speaking Exam Mode flow:
 * Part 1 -> Part 2 Prep (60s) -> Part 2 Speak (120s) -> Part 3 -> Finished
 * Drives segmented Live API sessions with system instruction + previous transcript injection.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ExamState,
  ExamTurn,
  ExamPartRecord,
  ExamSessionRecord,
  EXAM_DURATIONS,
  saveLastSessionTranscript,
  getStoredProgressDigest,
  formatSeconds,
} from '../lib/exam-flow';
import { ExamPaper, getRandomExamPaper } from '../data/questionBank';
import {
  buildPart1SystemInstruction,
  buildPart2SystemInstruction,
  buildPart3SystemInstruction,
} from '../lib/examiner-prompt';
import { LiveClient, LiveConnectionState, TranscriptEvent } from '../lib/live-client';
import { AudioCapture } from '../lib/audio-capture';
import { AudioPlaybackStreamer } from '../lib/audio-playback';

export interface UseExamFlowReturn {
  examState: ExamState;
  currentPart: 1 | 2 | 3 | null;
  paper: ExamPaper | null;
  remainingSeconds: number;
  formattedTime: string;
  connectionState: LiveConnectionState;
  isSpeaking: boolean;
  isRecording: boolean;
  isMuted: boolean;
  micVolume: number;
  errorMessage: string | null;
  isTransitioning: boolean;
  completedParts: ExamPartRecord[];
  currentPartTurns: ExamTurn[];
  progressDigest: string | null;
  startExam: (apiKey: string) => Promise<void>;
  nextPhase: () => Promise<void>;
  skipPrep: () => Promise<void>;
  abortExam: () => void;
  toggleMute: () => void;
  resetToIdle: () => void;
}

export function useExamFlow(): UseExamFlowReturn {
  const [examState, setExamState] = useState<ExamState>('IDLE');
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [completedParts, setCompletedParts] = useState<ExamPartRecord[]>([]);
  const [currentPartTurns, setCurrentPartTurns] = useState<ExamTurn[]>([]);
  const [progressDigest, setProgressDigest] = useState<string | null>(null);

  // References to keep handles stable across async transitions
  const apiKeyRef = useRef<string>('');
  const examStateRef = useRef<ExamState>('IDLE');
  examStateRef.current = examState;

  const paperRef = useRef<ExamPaper | null>(null);
  paperRef.current = paper;

  const completedPartsRef = useRef<ExamPartRecord[]>([]);
  completedPartsRef.current = completedParts;

  const currentPartTurnsRef = useRef<ExamTurn[]>([]);
  currentPartTurnsRef.current = currentPartTurns;

  const partStartTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);

  const timerIntervalRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const transitioningRef = useRef<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const liveClientRef = useRef<LiveClient | null>(null);
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlaybackStreamer | null>(null);

  // Append incoming transcript chunks or merge deltas
  const appendTranscriptDelta = useCallback((event: TranscriptEvent) => {
    setCurrentPartTurns((prev) => {
      const items = [...prev];
      const last = items[items.length - 1];

      if (last && last.speaker === event.speaker) {
        const updated: ExamTurn = {
          ...last,
          text: last.text + event.text,
        };
        items[items.length - 1] = updated;
        return items;
      } else {
        const newItem: ExamTurn = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          speaker: event.speaker,
          text: event.text,
          timestamp: Date.now(),
        };
        return [...items, newItem];
      }
    });
  }, []);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Stop current LiveClient WebSocket connection cleanly
  const disconnectLiveClient = useCallback(() => {
    // P1-6: Interrupt audio immediately on disconnect to ensure silence in prep phase
    playbackRef.current?.interrupt();
    if (liveClientRef.current) {
      try {
        liveClientRef.current.disconnect();
      } catch {
        // ignore
      }
      liveClientRef.current = null;
    }
    setConnectionState('disconnected');
    setIsSpeaking(false);
  }, []);

  // Completely tear down all audio and connection resources
  const teardownAll = useCallback(() => {
    deadlineRef.current = null;
    clearTimer();
    disconnectLiveClient();

    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }

    if (playbackRef.current) {
      playbackRef.current.close();
      playbackRef.current = null;
    }

    setIsRecording(false);
    setIsMuted(false);
    setMicVolume(0);
  }, [clearTimer, disconnectLiveClient]);

  // Connects a new Live session with specified systemInstruction
  const connectPartSession = useCallback(
    async (apiKey: string, systemInstruction: string): Promise<boolean> => {
      disconnectLiveClient();
      setErrorMessage(null);

      // Ensure playback streamer is initialized
      if (!playbackRef.current) {
        playbackRef.current = new AudioPlaybackStreamer({
          onPlayingStateChange: (playing) => {
            setIsSpeaking(playing);
          },
          onError: (err) => {
            console.error('[AudioPlayback] Error:', err);
          },
        });
      }

      // Initialize new LiveClient for this Part session
      const client = new LiveClient(
        {
          onStateChange: (state) => {
            setConnectionState(state);
          },
          onAudio: (pcmChunk) => {
            playbackRef.current?.enqueuePcmChunk(pcmChunk);
          },
          onTranscript: (event) => {
            appendTranscriptDelta(event);
          },
          onInterrupted: () => {
            playbackRef.current?.interrupt();
          },
          onError: (err) => {
            console.error('[LiveClient] Error in part session:', err);
            setErrorMessage(err.message || 'Gemini Live 连接异常');
            setConnectionState('error');
          },
        },
        {
          systemInstruction,
        }
      );
      liveClientRef.current = client;

      try {
        await client.connect(apiKey);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        setErrorMessage(`分段会话连接失败：${error.message}`);
        return false;
      }

      // Ensure audio capture is running
      if (!audioCaptureRef.current) {
        const capture = new AudioCapture({
          onChunk: (chunk) => {
            liveClientRef.current?.sendAudio(chunk);
          },
          onVolumeChange: (vol) => {
            setMicVolume(vol);
          },
          onError: (err) => {
            console.error('[AudioCapture] Mic error:', err);
            setErrorMessage('麦克风调用失败，请检查浏览器权限');
          },
        });
        audioCaptureRef.current = capture;

        try {
          await capture.start();
          setIsRecording(true);
          setIsMuted(false);
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          setErrorMessage(`麦克风启动失败: ${error.message}`);
          return false;
        }
      } else {
        // Unmute if existing
        audioCaptureRef.current.setMuted(false);
        setIsMuted(false);
      }

      return true;
    },
    [disconnectLiveClient, appendTranscriptDelta]
  );

  // Transition to next phase forward
  const nextPhase = useCallback(async () => {
    // P1-5: Prevent re-entrant state transitions
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setIsTransitioning(true);

    try {
      const currentState = examStateRef.current;
      const currentPaper = paperRef.current;
      const apiKey = apiKeyRef.current;

      if (!currentPaper) return;

      if (currentState === 'PART1') {
        // 1. Finalize Part 1
        clearTimer();
        const p1Record: ExamPartRecord = {
          part: 1,
          partTitle: 'Part 1: Introduction and Interview',
          topicInfo: {
            topics: currentPaper.part1Topics.map((t) => t.topic),
          },
          durationSeconds: Math.round((Date.now() - partStartTimeRef.current) / 1000),
          startedAt: partStartTimeRef.current,
          endedAt: Date.now(),
          turns: [...currentPartTurnsRef.current],
        };

        const updatedCompleted = [...completedPartsRef.current, p1Record];
        setCompletedParts(updatedCompleted);
        setCurrentPartTurns([]);

        // Disconnect Live session 1 during 60s prep
        disconnectLiveClient();
        if (audioCaptureRef.current) {
          audioCaptureRef.current.setMuted(true);
          setIsMuted(true);
        }

        // Move to PART2_PREP with wall-clock deadline
        const limitMs = EXAM_DURATIONS.PART2_PREP_SECONDS * 1000;
        deadlineRef.current = Date.now() + limitMs;
        setExamState('PART2_PREP');
        setRemainingSeconds(EXAM_DURATIONS.PART2_PREP_SECONDS);
        partStartTimeRef.current = Date.now();
      } else if (currentState === 'PART2_PREP') {
        // 2. Start PART2_SPEAK with wall-clock deadline
        clearTimer();
        const limitMs = EXAM_DURATIONS.PART2_SPEAK_SECONDS * 1000;
        deadlineRef.current = Date.now() + limitMs;
        setExamState('PART2_SPEAK');
        setRemainingSeconds(EXAM_DURATIONS.PART2_SPEAK_SECONDS);
        setCurrentPartTurns([]);
        partStartTimeRef.current = Date.now();

        const part1Record = completedPartsRef.current.find((p) => p.part === 1);
        const p2Instruction = buildPart2SystemInstruction(currentPaper.part2Card, part1Record);

        await connectPartSession(apiKey, p2Instruction);
      } else if (currentState === 'PART2_SPEAK') {
        // 3. Finalize Part 2 & Start PART3
        clearTimer();
        const p2Record: ExamPartRecord = {
          part: 2,
          partTitle: 'Part 2: Individual Long Turn',
          topicInfo: {
            cueCard: {
              id: currentPaper.part2Card.id,
              title: currentPaper.part2Card.title,
              cueCard: currentPaper.part2Card.cueCard,
            },
          },
          durationSeconds: Math.round((Date.now() - partStartTimeRef.current) / 1000),
          startedAt: partStartTimeRef.current,
          endedAt: Date.now(),
          turns: [...currentPartTurnsRef.current],
        };

        const updatedCompleted = [...completedPartsRef.current, p2Record];
        setCompletedParts(updatedCompleted);
        setCurrentPartTurns([]);

        // Move to PART3 with wall-clock deadline
        const limitMs = EXAM_DURATIONS.PART3_SECONDS * 1000;
        deadlineRef.current = Date.now() + limitMs;
        setExamState('PART3');
        setRemainingSeconds(EXAM_DURATIONS.PART3_SECONDS);
        partStartTimeRef.current = Date.now();

        const p3Instruction = buildPart3SystemInstruction(currentPaper.part2Card, updatedCompleted);
        await connectPartSession(apiKey, p3Instruction);
      } else if (currentState === 'PART3') {
        // 4. Finalize Part 3 & Finish Exam
        clearTimer();
        deadlineRef.current = null;
        const p3Record: ExamPartRecord = {
          part: 3,
          partTitle: 'Part 3: Two-way Discussion',
          topicInfo: {
            part3Theme: currentPaper.part2Card.topicCategory,
          },
          durationSeconds: Math.round((Date.now() - partStartTimeRef.current) / 1000),
          startedAt: partStartTimeRef.current,
          endedAt: Date.now(),
          turns: [...currentPartTurnsRef.current],
        };

        const finalCompleted = [...completedPartsRef.current, p3Record];
        setCompletedParts(finalCompleted);

        // Save complete session record
        const sessionRecord: ExamSessionRecord = {
          id: `session-${sessionStartTimeRef.current}`,
          startedAt: sessionStartTimeRef.current,
          endedAt: Date.now(),
          status: 'completed',
          progressDigestUsed: getStoredProgressDigest(),
          paper: currentPaper,
          parts: finalCompleted,
        };
        saveLastSessionTranscript(sessionRecord);

        teardownAll();
        setExamState('FINISHED');
      }
    } finally {
      transitioningRef.current = false;
      setIsTransitioning(false);
    }
  }, [clearTimer, disconnectLiveClient, connectPartSession, teardownAll]);

  // Start exam from IDLE
  const startExam = useCallback(
    async (apiKey: string) => {
      teardownAll();

      // P1-2: Initialize and resume AudioPlaybackStreamer directly within user gesture
      const playback = new AudioPlaybackStreamer({
        onPlayingStateChange: (playing) => {
          setIsSpeaking(playing);
        },
        onError: (err) => {
          console.error('[AudioPlayback] Error:', err);
        },
      });
      playbackRef.current = playback;
      try {
        await playback.resumeContext();
      } catch (err) {
        console.warn('[AudioPlayback] Failed to resume AudioContext during user gesture:', err);
      }

      apiKeyRef.current = apiKey.trim();

      const newPaper = getRandomExamPaper();
      setPaper(newPaper);
      paperRef.current = newPaper;

      const digest = getStoredProgressDigest();
      setProgressDigest(digest);

      setCompletedParts([]);
      completedPartsRef.current = [];
      setCurrentPartTurns([]);
      currentPartTurnsRef.current = [];

      const now = Date.now();
      sessionStartTimeRef.current = now;
      partStartTimeRef.current = now;

      // P1-1: Wall-clock deadline for Part 1
      const limitMs = EXAM_DURATIONS.PART1_SECONDS * 1000;
      deadlineRef.current = now + limitMs;
      setExamState('PART1');
      setRemainingSeconds(EXAM_DURATIONS.PART1_SECONDS);

      const p1Instruction = buildPart1SystemInstruction(newPaper.part1Topics, digest);
      await connectPartSession(apiKey, p1Instruction);
    },
    [teardownAll, connectPartSession]
  );

  // Skip prep button in Part 2
  const skipPrep = useCallback(async () => {
    if (examStateRef.current === 'PART2_PREP') {
      await nextPhase();
    }
  }, [nextPhase]);

  // Abort exam early
  const abortExam = useCallback(() => {
    const currentPaper = paperRef.current;
    if (currentPaper && sessionStartTimeRef.current) {
      const partialRecord: ExamSessionRecord = {
        id: `session-${sessionStartTimeRef.current}`,
        startedAt: sessionStartTimeRef.current,
        endedAt: Date.now(),
        status: 'aborted',
        progressDigestUsed: progressDigest,
        paper: currentPaper,
        parts: completedPartsRef.current,
      };
      saveLastSessionTranscript(partialRecord);
    }
    teardownAll();
    setExamState('ABORTED');
  }, [teardownAll, progressDigest]);

  // Toggle mute on active microphone
  const toggleMute = useCallback(() => {
    if (audioCaptureRef.current) {
      const nextMuted = !isMuted;
      audioCaptureRef.current.setMuted(nextMuted);
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  // Reset back to idle
  const resetToIdle = useCallback(() => {
    transitioningRef.current = false;
    setIsTransitioning(false);
    teardownAll();
    setExamState('IDLE');
    setPaper(null);
    setCompletedParts([]);
    setCurrentPartTurns([]);
    setErrorMessage(null);
  }, [teardownAll]);

  // Timer tick & wall-clock deadline synchronization (P1-1)
  const syncRemainingFromDeadline = useCallback(() => {
    const deadline = deadlineRef.current;
    if (!deadline) return;

    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    setRemainingSeconds(remaining);

    if (remaining <= 0) {
      clearTimer();
      deadlineRef.current = null;
      window.setTimeout(() => {
        void nextPhase();
      }, 0);
    }
  }, [clearTimer, nextPhase]);

  // Timer tick effect: uses wall-clock deadline and listens for visibilitychange
  useEffect(() => {
    const isCountingPhase =
      examState === 'PART1' ||
      examState === 'PART2_PREP' ||
      examState === 'PART2_SPEAK' ||
      examState === 'PART3';

    if (!isCountingPhase) {
      clearTimer();
      return;
    }

    clearTimer();
    syncRemainingFromDeadline();

    timerIntervalRef.current = window.setInterval(() => {
      syncRemainingFromDeadline();
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncRemainingFromDeadline();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examState, clearTimer, syncRemainingFromDeadline]);

  // Overall cleanup on unmount
  useEffect(() => {
    return () => {
      teardownAll();
    };
  }, [teardownAll]);

  // Current part calculation
  let currentPart: 1 | 2 | 3 | null = null;
  if (examState === 'PART1') currentPart = 1;
  else if (examState === 'PART2_PREP' || examState === 'PART2_SPEAK') currentPart = 2;
  else if (examState === 'PART3') currentPart = 3;

  return {
    examState,
    currentPart,
    paper,
    remainingSeconds,
    formattedTime: formatSeconds(remainingSeconds),
    connectionState,
    isSpeaking,
    isRecording,
    isMuted,
    micVolume,
    errorMessage,
    isTransitioning,
    completedParts,
    currentPartTurns,
    progressDigest,
    startExam,
    nextPhase,
    skipPrep,
    abortExam,
    toggleMute,
    resetToIdle,
  };
}
