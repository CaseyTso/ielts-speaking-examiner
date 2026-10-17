import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Play,
  Sparkles,
  FileText,
  ChevronRight,
  History,
} from 'lucide-react';
import {
  getStoredApiKey,
  maskApiKey,
  getStoredProgressDigest,
  getPracticeReports,
  PracticeReportRecord,
} from '../utils/storage';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState<string>('');
  const [digest, setDigest] = useState<string | null>(null);
  const [reports, setReports] = useState<PracticeReportRecord[]>([]);

  useEffect(() => {
    setApiKey(getStoredApiKey());
    setDigest(getStoredProgressDigest());
    setReports(getPracticeReports());
  }, []);

  const hasApiKey = Boolean(apiKey.trim());

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Top Banner & Hero */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-ios-blue/10 text-ios-blue-bright border border-ios-blue/20">
            <span>手机优先</span>
            <span>·</span>
            <span>Gemini 原生音频</span>
            <span>·</span>
            <span>练习报告 S3</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            ielts-speaking-examiner
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI 模拟雅思真实口语考官，通过 Gemini Live API 原生音频提供全真模考，生成四维度双层练习报告与跨场次进步摘要。
          </p>
        </div>

        {/* API Key Status Card */}
        <div className="p-4 rounded-2xl glass">
          {hasApiKey ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-400">API Key 已就绪</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700/80 font-mono text-slate-300">
                      {maskApiKey(apiKey)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    本地密钥就绪，支持一键连接 gemini-3.8-live 原生音频与报告生成
                  </p>
                </div>
              </div>
              <Link
                to="/settings"
                className="text-xs text-ios-blue-bright hover:text-ios-blue-bright font-medium whitespace-nowrap"
              >
                修改设置
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-400">未配置 Gemini API Key</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    本应用为 BYOK 架构，需先在设置页配置自己的 Google Gemini API Key 方可开启实时语音对话与报告生成。
                  </p>
                </div>
              </div>
              <Link
                to="/settings"
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-full bg-ios-blue hover:bg-ios-blue-bright text-white text-xs font-medium transition-colors shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>立即前往设置页面配置 Key</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* PROGRESS DIGEST DISPLAY (If available) */}
        {/* ========================================================== */}
        {digest && (
          <div className="p-4 rounded-2xl glass space-y-2.5 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-ios-blue/20 blur-3xl" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ios-blue-bright">
                <Sparkles className="w-4 h-4 text-ios-blue-bright" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  最新进步摘要 · Progress Digest
                </span>
              </div>
              <Link
                to="/history"
                className="text-[11px] text-ios-blue-bright hover:text-ios-blue-bright flex items-center gap-0.5"
              >
                <span>历史报告 ({reports.length})</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-ios-blue/20 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {digest}
            </div>

            <p className="text-[11px] text-ios-blue-bright/80 leading-snug">
              ℹ️ 此摘要已在模考 Part 1 自动注入考官系统提示词，考官将根据此画像自适应关注您的薄弱项。
            </p>
          </div>
        )}

        {/* Exam Mode Focus Card */}
        <div className="p-4 rounded-2xl glass space-y-3 relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-ios-blue/10 blur-3xl" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-ios-blue/20 text-ios-blue-bright border border-ios-blue/30">
              Exam Mode · 考官模式
            </span>
            <span className="text-xs text-slate-400 font-mono">Part 1 → 2 → 3</span>
          </div>

          <h3 className="text-base font-semibold text-white">雅思全真三部分模拟考试</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            严格按照真实考试流程：Part 1 问答（~4m）→ Part 2 题卡准备与独白（1m prep + 2m speak）→ Part 3 深度讨论（~4m）。考完即刻生成雅思官方四维度双层练习报告。
          </p>

          <button
            type="button"
            disabled={!hasApiKey}
            onClick={() => navigate('/exam')}
            className={`w-full py-3 px-4 rounded-full font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              hasApiKey
                ? 'bg-ios-blue hover:bg-ios-blue-bright text-white shadow-lg shadow-ios-blue/30 cursor-pointer pressable'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>进入考官模式完整模考</span>
          </button>
        </div>

        {/* Practice Reports History Entry Card */}
        <div className="p-3.5 rounded-2xl glass flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ios-blue/20 text-ios-blue-bright shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">练习报告与历史记录</span>
                {reports.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ios-blue/20 text-ios-blue-bright font-medium">
                    {reports.length} 份
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                回看逐题诊断改写、四维度总结，并支持一键导出 Markdown 原文
              </p>
            </div>
          </div>

          <Link
            to="/history"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <span>查看</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mode Preview Cards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl glass-subtle">
            <span className="text-xs font-semibold text-slate-100">真题题库</span>
            <p className="text-[11px] text-slate-300 mt-1">
              内置 6 大 Part 1 话题、16 张全真题卡与 64 道 Part 3 深度问题
            </p>
          </div>
          <div className="p-3.5 rounded-2xl glass-subtle">
            <span className="text-xs font-semibold text-slate-100">分段会话</span>
            <p className="text-[11px] text-slate-300 mt-1">
              每 Part 独立会话，注入前情摘要，突破 15 分钟免费额度限制
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-2 pt-2">
        <Link
          to="/history"
          className="w-full py-2.5 px-4 rounded-full font-medium text-xs text-slate-300 hover:text-white hover:bg-white/[0.07] transition-colors flex items-center justify-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          <span>查看所有历史练习报告 ({reports.length})</span>
        </Link>
        <Link
          to="/settings"
          className="w-full py-2.5 px-4 rounded-full font-medium text-xs text-slate-300 hover:text-white hover:bg-white/[0.07] transition-colors flex items-center justify-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>进入 BYOK 设置页面</span>
        </Link>
      </div>
    </div>
  );
};
