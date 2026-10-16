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

/**
 * Formats seconds into MM:SS string.
 */
export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
