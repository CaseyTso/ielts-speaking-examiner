/**
 * digest.ts
 * Updates the Progress Digest (进步摘要) across practice sessions.
 * Compares recent practice reports against the existing digest and extracts:
 * 1. 最近反复出现的问题 / 需重点关注的薄弱项
 * 2. 有所改善或保持良好的方面
 * Outputs a plain-text description stored in localStorage 'progress_digest'
 * to be injected into future Examiner system instructions.
 */

import {
  getStoredProgressDigest,
  setStoredProgressDigest,
  getPracticeReports,
  PracticeReportRecord,
} from '../utils/storage';
import { generateContentWithFallback, RestGenerateOptions, DEFAULT_REPORT_MODELS } from './gemini-rest';

export const DIGEST_MODELS = DEFAULT_REPORT_MODELS;

/**
 * Builds the prompt for Progress Digest synthesis.
 */
export function buildDigestPrompt(
  recentReports: PracticeReportRecord[],
  oldDigest?: string | null
): string {
  const previousDigestText =
    oldDigest && oldDigest.trim() ? oldDigest.trim() : '（暂无历史进步摘要，这是第一版提炼）';

  const reportsSummary = recentReports
    .map((r, idx) => {
      const dateStr = new Date(r.createdAt).toLocaleString('zh-CN', { hour12: false });
      return `--- 场次 #${idx + 1} (${dateStr} · ${r.topicSummary}) ---\n${r.markdown}`;
    })
    .join('\n\n');

  return `你是一位专业的雅思口语教研与考生画像追踪专家。
你的任务是根据考生最近几场的雅思口语练习报告（Practice Reports）以及上一版的进步摘要（若有），综合提炼并更新一份最新版本的「进步摘要（Progress Digest）」。

═════════════════════════════════════════════════════════════════════════
【核心用途】：
本进步摘要是一段纯文本画像，在后续练习开始时将直接注入 AI 雅思考官的 System Instruction 中，使考官能在后续模考的 Part 1 早期阶段与追问中自适应地留意该考生的薄弱项与巩固改善点。
═════════════════════════════════════════════════════════════════════════

【绝对硬性契约】：
1. 【纯文本格式，严禁复杂 Markdown 格式】：
   - 输出必须是直接连贯的纯文本段落（约 150-280 字）。
   - 严禁使用 Markdown 一二级标题（#、##）、代码块（\`\`\`）、表格等复杂修饰。可以使用简短的分行或项目符号（-）。
2. 【绝对严禁打分】：
   - 严禁出现任何分数、Band 值、评分数字或水平定级。
3. 【必须清晰包含两大核心维度】：
   - 1. 最近反复出现的系统性问题（如：时态一致性偶尔断裂、Part 3 抽象逻辑拓展偏短、定语从句连接不自然等需要考官留意的软肋）。
   - 2. 有所改善或保持良好的方面（如：回答连贯度与从容度提升、词汇同义替换意识增强等正面反馈）。
4. 【精准凝练、直切要害】：
   语言精炼专业，避免客套废话，直接供考官系统指令吸收。

═════════════════════════════════════════════════════════════════════════
【输入信息】：

[上一版进步摘要 (Old Digest)]:
${previousDigestText}

[最近练习报告诊断数据 (Recent Reports)]:
${reportsSummary}

═════════════════════════════════════════════════════════════════════════
请输出最新版纯文本「进步摘要（Progress Digest）」：
`;
}

/**
 * Updates the Progress Digest by reading recent reports and old digest,
 * querying the text model, and persisting the updated digest to localStorage.
 */
export async function updateProgressDigest(
  apiKey: string,
  providedReports?: PracticeReportRecord[],
  options?: RestGenerateOptions
): Promise<string> {
  const reports =
    providedReports && providedReports.length > 0
      ? providedReports
      : getPracticeReports().slice(0, 4);

  if (reports.length === 0) {
    return getStoredProgressDigest() || '';
  }

  const oldDigest = getStoredProgressDigest();
  const prompt = buildDigestPrompt(reports, oldDigest);

  const result = await generateContentWithFallback(prompt, apiKey, DIGEST_MODELS, options);
  const cleanDigest = result.text.trim();

  // Save back to localStorage
  setStoredProgressDigest(cleanDigest);

  return cleanDigest;
}
