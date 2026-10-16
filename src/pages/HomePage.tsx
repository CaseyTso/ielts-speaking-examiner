import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Play,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  getStoredApiKey,
  maskApiKey,
  getStoredProgressDigest,
  getLastSessionTranscript,
} from '../utils/storage';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState<string>('');
  const [hasDigest, setHasDigest] = useState<boolean>(false);
  const [hasLastSession, setHasLastSession] = useState<boolean>(false);

  useEffect(() => {
    setApiKey(getStoredApiKey());
    setHasDigest(Boolean(getStoredProgressDigest()));
    setHasLastSession(Boolean(getLastSessionTranscript()));
  }, []);

  const hasApiKey = Boolean(apiKey.trim());

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Top Banner & Hero */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span>手机优先</span>
            <span>·</span>
            <span>Gemini 原生音频</span>
            <span>·</span>
            <span>考官模式 S2</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            ielts-speaking-examiner
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI 模拟雅思真实口语考官，通过 Gemini Live API 原生音频提供实时口语对话与分段分场全真模考。
          </p>
        </div>

        {/* API Key Status Card */}
        <div className="p-4 rounded-xl border bg-slate-800/40 backdrop-blur">
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
                    本地密钥就绪，支持一键连接 gemini-3.8-live 原生音频
                  </p>
                </div>
              </div>
              <Link
                to="/settings"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
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
                    本应用为 BYOK 架构，需先在设置页配置自己的 Google Gemini API Key 方可开启实时语音对话。
                  </p>
                </div>
              </div>
              <Link
                to="/settings"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>立即前往设置页面配置 Key</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </div>
          )}
        </div>

        {/* Feature & Digest Badges */}
        {(hasDigest || hasLastSession) && (
          <div className="space-y-2">
            {hasDigest && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] leading-snug">
                  已检测到上次练习的进步摘要，将在模考 Part 1 自动注入考官提示词。
                </span>
              </div>
            )}
            {hasLastSession && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-snug">
                  本地存有上一场模考完整转录，待阶段 S3 提供评分评估报告。
                </span>
              </div>
            )}
          </div>
        )}

        {/* Exam Mode Focus Card */}
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Exam Mode · 考官模式
            </span>
            <span className="text-xs text-slate-400 font-mono">Part 1 → 2 → 3</span>
          </div>

          <h3 className="text-base font-semibold text-white">雅思全真三部分模拟考试</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            严格按照真实考试流程：Part 1 问答（~4m）→ Part 2 题卡准备与独白（1m prep + 2m speak）→ Part 3 深度讨论（~4m）。考官严格不纠错不打断，分段独立会话，连贯记录全场表现。
          </p>

          <button
            type="button"
            disabled={!hasApiKey}
            onClick={() => navigate('/exam')}
            className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              hasApiKey
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>进入考官模式完整模考</span>
          </button>
        </div>

        {/* Mode Preview Cards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/20">
            <span className="text-xs font-semibold text-slate-200">真题题库</span>
            <p className="text-[11px] text-slate-400 mt-1">
              内置 6 大 Part 1 话题、16 张全真题卡与 64 道 Part 3 深度问题
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/20">
            <span className="text-xs font-semibold text-slate-200">分段会话</span>
            <p className="text-[11px] text-slate-400 mt-1">
              每 Part 独立会话，注入前情摘要，突破 15 分钟免费额度限制
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pt-2">
        <Link
          to="/settings"
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>进入 BYOK 设置页面</span>
        </Link>
      </div>
    </div>
  );
};
