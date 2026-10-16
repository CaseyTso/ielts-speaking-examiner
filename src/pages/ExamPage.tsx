import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Timer,
  Bot,
  User,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  AlertCircle,
  Play,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  Award,
} from 'lucide-react';
import { getStoredApiKey } from '../utils/storage';
import { useExamFlow } from '../hooks/useExamFlow';

export const ExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState<string>('');
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  const {
    examState,
    currentPart,
    paper,
    remainingSeconds,
    formattedTime,
    connectionState,
    isSpeaking,
    isRecording,
    isMuted,
    micVolume,
    errorMessage,
    completedParts,
    currentPartTurns,
    progressDigest,
    startExam,
    nextPhase,
    skipPrep,
    abortExam,
    toggleMute,
    resetToIdle,
  } = useExamFlow();

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  // Auto-scroll transcript on updates
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPartTurns]);

  const hasApiKey = Boolean(apiKey.trim());

  const handleStart = async () => {
    if (!hasApiKey) return;
    await startExam(apiKey);
  };

  const handleAbort = () => {
    abortExam();
    setShowAbortConfirm(false);
  };

  // =========================================================================
  // RENDER: IDLE VIEW (Before starting exam)
  // =========================================================================
  if (examState === 'IDLE') {
    return (
      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Header Badge */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span>Exam Mode</span>
              <span>·</span>
              <span>全真雅思考官模拟</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              雅思口语完整模考
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              严格按照真实雅思考试标准流程完成 Part 1 → Part 2 → Part 3。考官全程严肃客观、不纠错、不打断，各阶段计时作答。
            </p>
          </div>

          {/* Exam Structure Explainer Card */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">考试流程概览</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Part 1 · Introduction & Interview</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">约 4 分钟</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    身份核验与日常生活问答（2 个随机话题，如 Work, Hometown, Reading 等，4-6 个小题）。
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Part 2 · Individual Long Turn</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">1m 准备 + 2m 独白</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    展示真实题卡（Cue Card），60 秒静音构思倒计时，随后进行 1-2 分钟个人连续陈述。
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Part 3 · Two-way In-depth Discussion</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">约 4 分钟</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    围绕 Part 2 话题展开抽象、深入、思辨的双向学术讨论，考官将针对回答深入追问。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Digest Notice (if available) */}
          {progressDigest ? (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-300">已检测到历史进步摘要 (Progress Digest)</p>
                <p className="text-[11px] text-indigo-200/80 mt-0.5 leading-relaxed">
                  系统已读取您上次练习的薄弱项，考官将在本场模考中自适应关注相关考察维度。
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                完成本次完整模考后，系统将在 S3 自动沉淀您的表现并提炼进步摘要。
              </p>
            </div>
          )}

          {/* API Key Status Notice */}
          {!hasApiKey && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">请先配置 Gemini API Key</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  模考需调用 Gemini Live 原生音频能力，请先在设置中填写您的个人密钥。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-4">
          <button
            type="button"
            disabled={!hasApiKey}
            onClick={handleStart}
            className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              hasApiKey
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>进入考场并开始模考</span>
          </button>

          <Link
            to="/"
            className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 text-center block transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: FINISHED VIEW (Exam successfully finished)
  // =========================================================================
  if (examState === 'FINISHED') {
    return (
      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <div className="text-center space-y-2 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">模考已顺利完成！</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              恭喜您完成了雅思口语完整三部分的模拟考试。考官已记录您的全场回答。
            </p>
          </div>

          {/* Parts Summary Cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">本场各部分记录</h3>
            <div className="space-y-2">
              {completedParts.map((p) => (
                <div
                  key={p.part}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Part {p.part}: {p.partTitle}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      时长: {Math.floor(p.durationSeconds / 60)}分{p.durationSeconds % 60}秒
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      {p.part === 1 && `话题: ${p.topicInfo.topics?.join('、')}`}
                      {p.part === 2 && `题卡: ${p.topicInfo.cueCard?.title}`}
                      {p.part === 3 && `主题: ${p.topicInfo.part3Theme} 深度讨论`}
                    </span>
                    <span className="text-slate-500">{p.turns.length} 轮互动</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistence Notice */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>全场转录已安全归档</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              完整对话转录已按 Part 结构保存至本地存储（<code className="text-slate-300">last_session_transcript</code>），阶段 S3 将以此生成雅思四项评分标准（流利连贯、词汇多样、语法广度准确度、发音）练习报告。
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-3">
          <button
            type="button"
            onClick={resetToIdle}
            className="w-full py-3 px-4 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>再练一场</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 text-center block transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: ABORTED VIEW
  // =========================================================================
  if (examState === 'ABORTED') {
    return (
      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4 pt-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <PhoneOff className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">模考已提前中止</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            您已提前结束本次考试。已完成部分的转录已被暂存。
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={resetToIdle}
            className="w-full py-3 px-4 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            重新开始模考
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: ACTIVE EXAM VIEWS (PART1, PART2_PREP, PART2_SPEAK, PART3)
  // =========================================================================
  const isPart2Prep = examState === 'PART2_PREP';
  const isPart2Speak = examState === 'PART2_SPEAK';
  const isTimeLow = remainingSeconds <= 30;

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3.5">
      {/* Top Header & Stage Status Bar */}
      <div className="space-y-2 pb-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {/* Part Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
              Part {currentPart}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {examState === 'PART1' && 'Part 1: 问答面试'}
              {examState === 'PART2_PREP' && 'Part 2: 题卡构思准备'}
              {examState === 'PART2_SPEAK' && 'Part 2: 个人陈述独白'}
              {examState === 'PART3' && 'Part 3: 深入双向讨论'}
            </span>
          </div>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
              isTimeLow
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Connection and Subtitle */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {isPart2Prep ? (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>静音准备中</span>
              </span>
            ) : connectionState === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>考官在线 (gemini-3.8-live)</span>
              </span>
            ) : connectionState === 'connecting' ? (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>连接分段会话中...</span>
              </span>
            ) : (
              <span className="text-slate-500">会话未连接</span>
            )}
          </div>

          {/* Abort Button */}
          {showAbortConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 text-[10px]">确定退出?</span>
              <button
                type="button"
                onClick={handleAbort}
                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-medium"
              >
                确认
              </button>
              <button
                type="button"
                onClick={() => setShowAbortConfirm(false)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAbortConfirm(true)}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
            >
              中止模考
            </button>
          )}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-[11px] text-rose-200/90">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => nextPhase()}
            className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-medium shrink-0"
          >
            跳过
          </button>
        </div>
      )}

      {/* Part 1 Topics Banner */}
      {examState === 'PART1' && paper && (
        <div className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="text-slate-500 font-medium">考查话题：</span>
          <span className="text-slate-300 truncate max-w-[240px]">
            {paper.part1Topics.map((t) => t.topic).join(' · ')}
          </span>
        </div>
      )}

      {/* ========================================================== */}
      {/* PART 2 CUE CARD DISPLAY (Active in PREP and SPEAK states) */}
      {/* ========================================================== */}
      {(isPart2Prep || isPart2Speak) && paper && (
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Candidate Task Card (题卡)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
              {paper.part2Card.topicCategory}
            </span>
          </div>

          <p className="text-xs font-semibold text-white leading-snug">
            {paper.part2Card.title}
          </p>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed">
            <p className="font-medium text-slate-400">You should say:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
              {paper.part2Card.bulletPoints.map((point, idx) => (
                <li key={idx} className="leading-snug">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* In PREP phase: 60s countdown action */}
          {isPart2Prep && (
            <div className="pt-1 flex items-center justify-between gap-3">
              <p className="text-[11px] text-amber-200/80">
                ⏱️ 请利用 60 秒理清答题要点（可记笔记）。
              </p>
              <button
                type="button"
                onClick={skipPrep}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <span>准备好了，开讲</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Part 3 Theme Banner */}
      {examState === 'PART3' && paper && (
        <div className="px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center justify-between">
          <span className="text-indigo-400 font-medium">深度讨论领域：</span>
          <span className="text-slate-200 truncate max-w-[240px]">
            {paper.part2Card.topicCategory} · 抽象议题
          </span>
        </div>
      )}

      {/* ========================================================== */}
      {/* CONVERSATION TRANSCRIPT AREA */}
      {/* ========================================================== */}
      <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
        {/* Completed Parts Divider Notices */}
        {completedParts.map((cp) => (
          <div
            key={cp.part}
            className="flex items-center justify-center gap-2 py-1 text-[10px] text-slate-500 border-b border-slate-800/50"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Part {cp.part} 已结束并归档</span>
          </div>
        ))}

        {currentPartTurns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-400/40" />
            <p className="text-xs text-slate-400">
              {isPart2Prep
                ? '题卡准备中，麦克风已自动静音...'
                : '考官即将就本部分开场发问...'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-[220px]">
              {isPart2Prep
                ? '构思结束后将自动进入 2 分钟陈述'
                : '请自然用英语对麦克风作答，双方语音转录将实时呈现'}
            </p>
          </div>
        ) : (
          currentPartTurns.map((item) => (
            <div
              key={item.id}
              className={`flex gap-2.5 ${
                item.speaker === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {item.speaker === 'model' && (
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  item.speaker === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/95 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 mb-1">
                  <span className="font-semibold">
                    {item.speaker === 'user' ? '考生 (You)' : '考官 (Examiner)'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{item.text || '...'}</p>
              </div>

              {item.speaker === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* ========================================================== */}
      {/* BOTTOM CONTROLS & TIMING ACTIONS */}
      {/* ========================================================== */}
      <div className="space-y-2 pt-1">
        {/* Speaking Status Pill */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-slate-800/90 border border-slate-700/60">
            {isSpeaking ? (
              <span className="text-indigo-300 font-medium">考官发音中...</span>
            ) : isRecording && !isMuted ? (
              <>
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + Math.min(micVolume, 1) * 0.8})`,
                  }}
                />
                <span className="text-emerald-300 font-medium">
                  {micVolume > 0.08 ? '正在收音中...' : '麦克风已开启，请作答'}
                </span>
              </>
            ) : isMuted ? (
              <span className="text-amber-300">麦克风已静音</span>
            ) : (
              <span className="text-slate-400">准备中...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute button (only active during speaking phases) */}
          <button
            type="button"
            disabled={isPart2Prep}
            onClick={toggleMute}
            className={`px-3 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border ${
              isMuted
                ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? '取消静音' : '静音'}</span>
          </button>

          {/* Phase progression button */}
          <button
            type="button"
            onClick={() => nextPhase()}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <span>
              {examState === 'PART1' && '进入 Part 2 题卡准备'}
              {examState === 'PART2_PREP' && '准备好了，开始独白'}
              {examState === 'PART2_SPEAK' && '独白完毕，进入 Part 3'}
              {examState === 'PART3' && '结束模考并归档'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
