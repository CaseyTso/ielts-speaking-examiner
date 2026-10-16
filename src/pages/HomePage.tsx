import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Play,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  AlertCircle,
  Sparkles,
  User,
  Bot,
  Volume2,
} from 'lucide-react';
import { getStoredApiKey, maskApiKey } from '../utils/storage';
import { useLiveSession } from '../hooks/useLiveSession';

export const HomePage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [inSession, setInSession] = useState<boolean>(false);

  const {
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
  } = useLiveSession();

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  // Auto-scroll transcript container
  useEffect(() => {
    if (inSession && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, inSession]);

  const hasApiKey = Boolean(apiKey.trim());

  const handleStartPractice = async () => {
    if (!hasApiKey) return;
    setInSession(true);
    await startSession(apiKey);
  };

  const handleExitSession = () => {
    stopSession();
    setInSession(false);
  };

  const handleRetry = async () => {
    if (!hasApiKey) return;
    await startSession(apiKey);
  };

  // ==========================================
  // Session Active View (Live Conversation)
  // ==========================================
  if (inSession) {
    return (
      <div className="flex-1 flex flex-col justify-between space-y-4">
        {/* Session Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {connectionState === 'connected' && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            {connectionState === 'connecting' && (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            )}
            {connectionState === 'error' && (
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            )}
            {connectionState === 'disconnected' && (
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
            )}

            <span className="text-xs font-medium text-slate-300">
              {connectionState === 'connected' && '考官已就绪 · gemini-3.8-live'}
              {connectionState === 'connecting' && '正在连接考官...'}
              {connectionState === 'error' && '连接发生错误'}
              {connectionState === 'disconnected' && '连接已断开'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExitSession}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
            <span>结束练习</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-300">连接提示</p>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重试</span>
            </button>
          </div>
        )}

        {/* Speaking Status Pill */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs bg-slate-800/80 border border-slate-700/60 shadow-inner">
            {isSpeaking ? (
              <>
                <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-indigo-300 font-medium">考官正在讲话 (Native Audio)...</span>
              </>
            ) : isRecording && !isMuted ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + Math.min(micVolume, 1) * 0.8})`,
                  }}
                />
                <span className="text-emerald-300 font-medium">
                  {micVolume > 0.08 ? '正在聆听您的回答...' : '麦克风已开启，请开口作答'}
                </span>
              </>
            ) : isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">麦克风已暂停</span>
              </>
            ) : (
              <span className="text-slate-400">准备中...</span>
            )}
          </div>
        </div>

        {/* Real-time Conversation Transcripts Area */}
        <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto space-y-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
          {transcripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Sparkles className="w-7 h-7 text-indigo-400/50" />
              <p className="text-xs text-slate-400">
                双向实时语音已就绪。
              </p>
              <p className="text-[11px] text-slate-500 max-w-[240px]">
                您可以直接对麦克风用英语说话；考官将以原生音频回复，双方转录（Transcript）将实时呈现于此。
              </p>
              {connectionState === 'connected' && (
                <button
                  type="button"
                  onClick={() => sendTextMessage('Hello examiner, I am ready for the speaking test.')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs transition-colors"
                >
                  打个招呼: "Hello examiner, I am ready."
                </button>
              )}
            </div>
          ) : (
            transcripts.map((item) => (
              <div
                key={item.id}
                className={`flex gap-2.5 ${
                  item.speaker === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {item.speaker === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    item.speaker === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 mb-1">
                    <span className="font-semibold">
                      {item.speaker === 'user' ? '考生 (You)' : '考官 (Examiner)'}
                    </span>
                    {!item.isFinal && (
                      <span className="italic text-[9px] animate-pulse">流式接收中...</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{item.text || '...'}</p>
                </div>

                {item.speaker === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Bottom Controls */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isMuted
                  ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30'
                  : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>恢复麦克风</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>麦克风工作中 (点击暂停)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExitSession}
              className="py-3 px-4 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4 text-rose-400" />
              <span>退出</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            双向音频流传输中 · 原生音频直接对话 · 打断发言将即时重置输出
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Home Landing View
  // ==========================================
  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      {/* Top Banner & Hero */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span>手机优先</span>
            <span>·</span>
            <span>Gemini 原生音频</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            ielts-speaking-examiner
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI 模拟雅思真实口语考官，通过 Gemini Live API 原生音频提供实时口语对话与双向转录。
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

      {/* Bottom Action Area */}
      <div className="space-y-3 pt-2">
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
