import type { ExamSessionRecord } from '../lib/exam-flow';

export const STORAGE_KEY_GEMINI_API_KEY = 'gemini_api_key';
export const STORAGE_KEY_PROGRESS_DIGEST = 'progress_digest';
export const STORAGE_KEY_LAST_SESSION_TRANSCRIPT = 'last_session_transcript';
export const STORAGE_KEY_PRACTICE_REPORTS = 'practice_reports';

export interface PracticeReportRecord {
  id: string;
  sessionId: string;
  createdAt: number;
  topicSummary: string;
  markdown: string;
  modelUsed?: string;
}

/**
 * Retrieves all saved practice reports from localStorage, ordered newest first.
 */
export function getPracticeReports(): PracticeReportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRACTICE_REPORTS);
    if (!raw) return [];
    const list = JSON.parse(raw) as PracticeReportRecord[];
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn('Failed to parse practice_reports from localStorage:', err);
    return [];
  }
}

/**
 * Retrieves a single practice report by its unique ID.
 */
export function getPracticeReportById(id: string): PracticeReportRecord | null {
  const reports = getPracticeReports();
  return reports.find((r) => r.id === id) || null;
}

/**
 * Saves or updates a practice report in localStorage.
 */
export function savePracticeReport(report: PracticeReportRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const reports = getPracticeReports();
    const existingIndex = reports.findIndex((r) => r.id === report.id);
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.unshift(report);
    }
    localStorage.setItem(STORAGE_KEY_PRACTICE_REPORTS, JSON.stringify(reports, null, 2));
  } catch (err) {
    console.error('Failed to save practice report to localStorage:', err);
  }
}

/**
 * Deletes a practice report from localStorage by ID.
 */
export function deletePracticeReport(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const reports = getPracticeReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_PRACTICE_REPORTS, JSON.stringify(reports, null, 2));
  } catch (err) {
    console.error('Failed to delete practice report from localStorage:', err);
  }
}

/**
 * Clears all practice reports from localStorage.
 */
export function clearAllPracticeReports(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_PRACTICE_REPORTS);
  } catch (err) {
    console.error('Failed to clear practice reports from localStorage:', err);
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
 * Saves a session transcript to localStorage.
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
 * Reads the progress digest from localStorage.
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
 * Saves a progress digest to localStorage (used for testing or S3).
 */
export function setStoredProgressDigest(digest: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS_DIGEST, digest.trim());
  } catch (e) {
    console.error('Failed to save progress_digest to localStorage', e);
  }
}

/**
 * Reads the stored Gemini API key from localStorage.
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI_API_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Saves the Gemini API key to localStorage.
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_API_KEY, key.trim());
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

/**
 * Clears the stored Gemini API key from localStorage.
 */
export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI_API_KEY);
  } catch (e) {
    console.error('Failed to clear API key from localStorage', e);
  }
}

/**
 * Masks an API key for safe display (e.g. AIza...WLw).
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-3);
  return `${prefix}...${suffix}`;
}

/**
 * Tests connection to Google Gemini API using the provided key.
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models?key=<key>
 */
export async function testApiKeyConnection(key: string): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  const trimmed = key.trim();
  if (!trimmed) {
    return {
      success: false,
      message: '请先输入或保存 API Key',
    };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const modelCount = Array.isArray(data.models) ? data.models.length : 0;
      return {
        success: true,
        message: `连接成功！API Key 有效（可访问 ${modelCount} 个 Gemini 模型）`,
      };
    }

    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error && errorJson.error.message) {
        errorDetail = errorJson.error.message;
      }
    } catch {
      // fallback to status code
    }

    if (response.status === 400 || response.status === 403) {
      return {
        success: false,
        message: '连接失败：API Key 无效或未启用权限',
        details: errorDetail,
      };
    }

    return {
      success: false,
      message: `连接失败：${errorDetail}`,
      details: errorDetail,
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: '网络连接失败，请检查网络或代理连接',
      details: errMessage,
    };
  }
}
