/**
 * exam-flow.ts
 * Exam Mode state machine definitions, session records, and storage persistence.
 */

import { ExamPaper } from '../data/questionBank';

export type ExamState =
  | 'IDLE'
  | 'PART1'
  | 'PART2_PREP'
  | 'PART2_SPEAK'
  | 'PART3'
  | 'FINISHED'
  | 'ABORTED';

export interface ExamTurn {
  id: string;
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ExamPartRecord {
  part: 1 | 2 | 3;
  partTitle: string;
  topicInfo: {
    topics?: string[];
    cueCard?: {
      id: string;
      title: string;
      cueCard: string;
    };
    part3Theme?: string;
  };
  durationSeconds: number;
  startedAt: number;
  endedAt: number;
  turns: ExamTurn[];
}

export interface ExamSessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  status: 'completed' | 'aborted';
  progressDigestUsed?: string | null;
  paper: ExamPaper;
  parts: ExamPartRecord[];
}

/**
 * Standard IELTS speaking time limits (in seconds).
 */
export const EXAM_DURATIONS = {
  PART1_SECONDS: 240,       // ~4 minutes interview
  PART2_PREP_SECONDS: 60,   // 1 minute silent prep
  PART2_SPEAK_SECONDS: 120, // 2 minutes monologue
  PART3_SECONDS: 240,       // ~4 minutes discussion
} as const;

export const STORAGE_KEY_LAST_SESSION_TRANSCRIPT = 'last_session_transcript';
export const STORAGE_KEY_PROGRESS_DIGEST = 'progress_digest';

/**
 * Reads the progress digest from previous sessions from localStorage.
 */
export function getStoredProgressDigest(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY_PROGRESS_DIGEST);
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Persists the complete session transcript (grouped by Part) to localStorage.
 */
export function saveLastSessionTranscript(record: ExamSessionRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SESSION_TRANSCRIPT, JSON.stringify(record, null, 2));
  } catch (err) {
    console.error('Failed to save last_session_transcript to localStorage:', err);
  }
}

/**
 * Retrieves the last stored session transcript from localStorage.
 */
export function getLastSessionTranscript(): ExamSessionRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SESSION_TRANSCRIPT);
    if (!raw) return null;
    return JSON.parse(raw) as ExamSessionRecord;
  } catch (err) {
    console.warn('Failed to parse last_session_transcript from localStorage:', err);
    return null;
  }
}

/**
 * Formats seconds into MM:SS string.
 */
export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
