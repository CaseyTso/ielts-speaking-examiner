/**
 * report.ts
 * Generates IELTS Practice Reports based on session transcripts using Gemini text models.
 * Strictly adheres to:
 * 1. NO SCORES, NO BANDS, NO NUMERICAL RATINGS.
 * 2. Dual-layer structure:
 *    - Layer 1: By Part & Question (你说了什么 → 问题在哪 → 更好的说法)
 *    - Layer 2: 跨维度系统总结 across the official 4 criteria (Fluency & Coherence, Lexical Resource,
 *      Grammatical Range & Accuracy, Pronunciation with mandatory textual inference disclaimer).
 * 3. Text model fallback: gemini-3.5-flash -> gemini-3.5-flash-lite -> gemini-flash-lite-latest.
 */

import type { ExamSessionRecord, ExamTurn } from './exam-flow';
import type { PracticeReportRecord } from '../utils/storage';
import { generateContentWithFallback, RestGenerateOptions, DEFAULT_REPORT_MODELS } from './gemini-rest';

export const REPORT_MODELS = DEFAULT_REPORT_MODELS;

/**
 * Extracts a concise human-readable topic summary from an ExamSessionRecord.
 */
export function extractTopicSummary(session: ExamSessionRecord): string {
  const partsSummary: string[] = [];

  // Part 1 topics
  const p1 = session.parts.find((p) => p.part === 1);
  if (p1?.topicInfo.topics && p1.topicInfo.topics.length > 0) {
    partsSummary.push(`Part 1: ${p1.topicInfo.topics.join('、')}`);
  } else if (session.paper?.part1Topics) {
    partsSummary.push(`Part 1: ${session.paper.part1Topics.map((t) => t.topic).join('、')}`);
  }

  // Part 2 Cue card
  const p2 = session.parts.find((p) => p.part === 2);
  if (p2?.topicInfo.cueCard?.title) {
    partsSummary.push(`Part 2: ${p2.topicInfo.cueCard.title}`);
  } else if (session.paper?.part2Card?.title) {
    partsSummary.push(`Part 2: ${session.paper.part2Card.title}`);
  }

  // Part 3 Theme
  const p3 = session.parts.find((p) => p.part === 3);
  if (p3?.topicInfo.part3Theme) {
    partsSummary.push(`Part 3: ${p3.topicInfo.part3Theme}`);
  } else if (session.paper?.part2Card?.topicCategory) {
    partsSummary.push(`Part 3: ${session.paper.part2Card.topicCategory} 深入讨论`);
  }

  return partsSummary.length > 0
    ? partsSummary.join(' · ')
    : '雅思口语全三部分模考';
}

/**
 * Formats turns into human-readable dialogue blocks for the prompt.
 */
function formatTurns(turns: ExamTurn[]): string {
  if (!turns || turns.length === 0) {
    return '（本阶段未记录到文字转录）';
  }
  return turns
    .map((t) => {
      const speaker = t.speaker === 'user' ? '【考生 (Candidate)】' : '【考官 (Examiner)】';
      const text = t.text.trim() || '（无语音或转录未抓取）';
      return `${speaker}: ${text}`;
    })
    .join('\n');
}

/**
 * Builds the comprehensive, strictly constrained prompt for Practice Report generation.
 */
export function buildReportPrompt(session: ExamSessionRecord): string {
  const p1 = session.parts.find((p) => p.part === 1);
  const p2 = session.parts.find((p) => p.part === 2);
  const p3 = session.parts.find((p) => p.part === 3);

  const p1Topics =
    p1?.topicInfo.topics?.join(', ') ||
    session.paper?.part1Topics.map((t) => t.topic).join(', ') ||
    'General Topics';

  const p2CardTitle =
    p2?.topicInfo.cueCard?.title || session.paper?.part2Card?.title || 'Cue Card Monologue';

  const p2CardBullets =
    session.paper?.part2Card?.bulletPoints?.map((b) => `- ${b}`).join('\n') || '';

  const p3Theme =
    p3?.topicInfo.part3Theme || session.paper?.part2Card?.topicCategory || 'Abstract Themes';

  const p1Dialogue = formatTurns(p1?.turns || []);
  const p2Dialogue = formatTurns(p2?.turns || []);
  const p3Dialogue = formatTurns(p3?.turns || []);

  return `你是一位资深且专业的雅思官方口语评估专家与语言教练。
请对以下雅思口语完整模考场次（Part 1 + Part 2 + Part 3）的完整对话转录进行深度诊断剖析，生成一份高质量、具有极强实操指导价值的「练习报告（Practice Report）」，格式为严谨且优美的 Markdown。

═════════════════════════════════════════════════════════════════════════
【绝对硬性契约 / 核心约束 - 必须 100% 遵守，严禁违背】
═════════════════════════════════════════════════════════════════════════
1. 【通篇绝对严禁出现任何分数与水平定位】：
   - 严禁出现任何形式的分数、Band 值、等级评分或分数预测数字（例如：绝对不要出现 "Band 6", "预计 6.5", "总分: 7", "Grammar: 6.0", "得分：5.5/9" 等任何评分数字与等级定位标签）。
   - 报告通篇的核心与主体是「诊断定位与可落地改写的可执行反馈」，而不是评判成绩。

2. 【必须严格遵循双层结构】：
   报告正文必须且只能按照以下两层结构展开：

   ─────────────────────────────────────────────────────────────
   第一层：按考试流程逐题组织（Part 1 → Part 2 → Part 3 逐题诊断与示范改写）
   ─────────────────────────────────────────────────────────────
   在每个 Part 下，针对考生的每个回答（或 Part 2 的陈述段落），逐题详细呈现以下三个核心模块：
   - 题目 / 提问：考官提出的具体问题或题卡核心要求
   - 你说了什么（摘要）：提炼考生作答的核心内容与关键原话片段
   - 问题在哪：从流利度、词汇多样度与精准度、语法结构与正确性等方面深入剖析该回答的具体问题（如逻辑断层、高频简单词重复、冠词/单复数/时态失误、句子结构单调等）
   - 更好的说法（示范改写）：给出 1~2 处符合雅思高阶口语习惯的自然地道示范改写（提供地道的英文示范改写，并提炼重点高阶搭配或句型结构，避免死板书面语）

   ─────────────────────────────────────────────────────────────
   第二层：末尾「跨维度系统总结」（雅思官方四评分标准全场综合归纳）
   ─────────────────────────────────────────────────────────────
   在报告末尾，必须设立独立的"跨维度系统总结"大节，按照雅思官方四大评分维度，归纳考生在全场表现中反复暴露的系统性问题及针对性突破方案：
   1. Fluency & Coherence（流利度与连贯性）：
      归纳全场的语流连贯度、停顿与思维卡顿特征、过渡连接词使用广度、逻辑拓展深度。
   2. Lexical Resource（词汇多样性与准确性）：
      归纳词汇广度、高频陈旧词依赖度、习语与搭配精准度、同义替换能力。
   3. Grammatical Range & Accuracy（语法多样性与准确度）：
      归纳时态一致性（如现在时/过去时混淆）、复杂句型驾驭力（状语从句、定语从句、倒装等）及高频语法软肋。
   4. Pronunciation（发音表现）：
      【诚实标注硬约束】：在此小节开头或关键位置，必须显式标注以下文字：
      "*注：发音反馈基于转录文本推断，仅供参考*"
      结合转录文本所反映出的停顿断句、连读流畅度感知或容易误读的词汇展开有限推断并提供自练建议。

3. 【格式与语言规范】：
   - 报告必须使用严谨清晰的 Markdown 格式输出。
   - 诊断与解析以中文为主，示范表达与高阶搭配为地道英文。
   - 层次清晰，善用各级标题（#、##、###）、引用块（>）、列表（-）与重点加粗（**）。

═════════════════════════════════════════════════════════════════════════
【本场练习转录数据（TRANSCRIPT）】
═════════════════════════════════════════════════════════════════════════

### PART 1: Introduction & Interview
- 考查话题：${p1Topics}
- 实际对话记录：
${p1Dialogue}

### PART 2: Individual Long Turn
- 题卡题目：${p2CardTitle}
- 题卡提示要点：
${p2CardBullets}
- 实际独白陈述记录：
${p2Dialogue}

### PART 3: Two-way In-depth Discussion
- 深入讨论领域：${p3Theme}
- 实际双向讨论记录：
${p3Dialogue}

═════════════════════════════════════════════════════════════════════════
请现在开始生成完整的 Markdown 练习报告（严格执行不打分契约与双层结构）：
`;
}

/**
 * Generates an IELTS Practice Report using Gemini text model with automatic fallback.
 */
export async function generatePracticeReport(
  session: ExamSessionRecord,
  apiKey: string,
  options?: RestGenerateOptions
): Promise<PracticeReportRecord> {
  const prompt = buildReportPrompt(session);
  const result = await generateContentWithFallback(prompt, apiKey, REPORT_MODELS, options);

  const topicSummary = extractTopicSummary(session);
  const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: reportId,
    sessionId: session.id,
    createdAt: Date.now(),
    topicSummary,
    markdown: result.text,
    modelUsed: result.modelUsed,
  };
}

/**
 * Triggers a client-side download of the Practice Report as a .md file.
 */
export function downloadMarkdownReport(report: PracticeReportRecord): void {
  if (typeof window === 'undefined') return;

  const dateStr = new Date(report.createdAt).toISOString().slice(0, 10);
  const cleanSummary = report.topicSummary
    .replace(/[/\\?%*:|"<>]/g, '_')
    .slice(0, 30)
    .trim();
  const filename = `ielts-practice-report-${dateStr}-${cleanSummary || 'session'}.md`;

  const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
