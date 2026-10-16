import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldAlert, ShieldCheck, ArrowRight, Play, Info, AlertTriangle } from 'lucide-react';
import { getStoredApiKey, maskApiKey } from '../utils/storage';

export const HomePage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showNotice, setShowNotice] = useState<boolean>(false);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  const hasApiKey = Boolean(apiKey.trim());

  const handleStartPractice = () => {
    if (!hasApiKey) return;
    setShowNotice(true);
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Top Banner & Hero */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span>手机优先</span>
            <span>·</span>
            <span>BYOK 零鉴权</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            ielts-speaking-examiner
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI 模拟雅思真实口语考官，提供标准三阶段（Part 1 / Part 2 / Part 3）对话练习与即时评估反馈。
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
                    已保存在本地浏览器，可随时在设置中测试或更换
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
                    本应用为 BYOK 架构，需先在设置页配置自己的 Google Gemini API Key 方可开启练习。
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

        {/* Mode Preview Cards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/20">
            <span className="text-xs font-semibold text-slate-200">Exam Mode</span>
            <p className="text-[11px] text-slate-400 mt-1">
              真实考场流程，不纠错不打断，计时作答，结束后产出 Practice Report
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/20">
            <span className="text-xs font-semibold text-slate-200">Coach Mode</span>
            <p className="text-[11px] text-slate-400 mt-1">
              即时纠错与求助，无时间限制，唤醒词随时打断提问获取改进指导
            </p>
          </div>
        </div>
      </div>

      {/* Notice Toast / Dialog for S1 */}
      {showNotice && (
        <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-indigo-300">当前阶段：S0 骨架与 BYOK</p>
            <p className="mt-0.5 text-slate-300">
              Live API 音频双向连接与考官练习会话功能将在阶段 S1 上线，当前已验证工程骨架与 API Key 配置。
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-slate-400 hover:text-white text-xs font-mono px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Action Area */}
      <div className="space-y-3 pt-2">
        {!hasApiKey && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs px-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>请先在设置中填入 API Key 后再开始练习</span>
          </div>
        )}

        <button
          type="button"
          disabled={!hasApiKey}
          onClick={handleStartPractice}
          className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            hasApiKey
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>开始练习</span>
        </button>

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
