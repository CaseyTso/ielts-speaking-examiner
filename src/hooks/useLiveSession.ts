/**
 * useLiveSession.ts
 * React hook orchestrating LiveClient, AudioCapture, and AudioPlaybackStreamer
 * into a single unified reactive state for the voice conversation view.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveClient, LiveConnectionState, TranscriptEvent } from '../lib/live-client';
import { AudioCapture } from '../lib/audio-capture';
import { AudioPlaybackStreamer } from '../lib/audio-playback';

export interface TranscriptItem {
  id: string;
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface UseLiveSessionReturn {
  connectionState: LiveConnectionState;
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  micVolume: number;
  transcripts: TranscriptItem[];
  errorMessage: string | null;
  startSession: (apiKey: string) => Promise<void>;
  stopSession: () => void;
  toggleMute: () => void;
  sendTextMessage: (text: string) => void;
  clearTranscripts: () => void;
}

export function useLiveSession(): UseLiveSessionReturn {
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const liveClientRef = useRef<LiveClient | null>(null);
  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlaybackStreamer | null>(null);

  // Keep a ref of transcripts to append streaming chunks without stale state issues
  const transcriptsRef = useRef<TranscriptItem[]>([]);
  transcriptsRef.current = transcripts;

  const appendTranscriptDelta = useCallback((event: TranscriptEvent) => {
    setTranscripts((prev) => {
      const items = [...prev];
      const last = items[items.length - 1];

      if (last && last.speaker === event.speaker && !last.isFinal) {
        // Append to current speaker's active turn
        const updated: TranscriptItem = {
          ...last,
          text: last.text + event.text,
          isFinal: Boolean(event.isFinal),
        };
        items[items.length - 1] = updated;
        return items;
      } else {
        // Start a new speaker turn
        const newItem: TranscriptItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          speaker: event.speaker,
          text: event.text,
          isFinal: Boolean(event.isFinal),
          timestamp: Date.now(),
        };
        return [...items, newItem];
      }
    });
  }, []);

  const finalizeLatestTurn = useCallback(() => {
    setTranscripts((prev) => {
      if (prev.length === 0) return prev;
      const items = [...prev];
      const last = items[items.length - 1];
      if (last && !last.isFinal) {
        items[items.length - 1] = { ...last, isFinal: true };
        return items;
      }
      return prev;
    });
  }, []);

  const stopSession = useCallback(() => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }
    if (playbackRef.current) {
      playbackRef.current.close();
      playbackRef.current = null;
    }
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      liveClientRef.current = null;
    }

    setIsRecording(false);
    setIsMuted(false);
    setIsSpeaking(false);
    setMicVolume(0);
    setConnectionState('disconnected');
  }, []);

  const startSession = useCallback(
    async (apiKey: string) => {
      stopSession();
      setErrorMessage(null);

      // 1. Initialize playback streamer
      const playback = new AudioPlaybackStreamer({
        onPlayingStateChange: (playing) => {
          setIsSpeaking(playing);
        },
        onError: (err) => {
          console.error('[Playback] Error:', err);
        },
      });
      playbackRef.current = playback;

      // 2. Initialize Live API client
      const liveClient = new LiveClient({
        onStateChange: (state) => {
          setConnectionState(state);
        },
        onAudio: (pcmChunk) => {
          playback.enqueuePcmChunk(pcmChunk);
        },
        onTranscript: (event) => {
          appendTranscriptDelta(event);
        },
        onInterrupted: () => {
          playback.interrupt();
          finalizeLatestTurn();
        },
        onTurnComplete: () => {
          finalizeLatestTurn();
        },
        onError: (err) => {
          console.error('[LiveClient] Error:', err);
          setErrorMessage(err.message || 'Gemini Live 连接异常');
          setConnectionState('error');
        },
      });
      liveClientRef.current = liveClient;

      // 3. Connect to WebSocket
      try {
        await liveClient.connect(apiKey);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        setErrorMessage(`连接失败：${error.message}`);
        stopSession();
        return;
      }

      // 4. Initialize microphone capture
      const capture = new AudioCapture({
        onChunk: (chunk) => {
          liveClient.sendAudio(chunk);
        },
        onVolumeChange: (vol) => {
          setMicVolume(vol);
        },
        onError: (err) => {
          console.error('[AudioCapture] Mic error:', err);
          let msg = '麦克风调用失败';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = '麦克风权限被拒绝，请在浏览器权限设置中允许访问麦克风';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = '未检测到可用的麦克风硬件设备';
          }
          setErrorMessage(msg);
          stopSession();
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
        stopSession();
      }
    },
    [stopSession, appendTranscriptDelta, finalizeLatestTurn]
  );

  const toggleMute = useCallback(() => {
    if (audioCaptureRef.current) {
      const nextMuted = !isMuted;
      audioCaptureRef.current.setMuted(nextMuted);
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  const sendTextMessage = useCallback((text: string) => {
    if (liveClientRef.current && text.trim()) {
      liveClientRef.current.sendTextMessage(text.trim());
      // Append user transcript locally as fallback
      setTranscripts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          speaker: 'user',
          text: text.trim(),
          isFinal: true,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    connectionState,
    isRecording,
    isMuted,
    isSpeaking,
    micVolume,
    transcripts,
    errorMessage,
    startSession,
    stopSession,
    toggleMute,
    sendTextMessage,
    clearTranscripts,
  };
}
