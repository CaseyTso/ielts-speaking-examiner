import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  maskApiKey,
  testApiKeyConnection,
} from '../utils/storage';

export const SettingsPage: React.FC = () => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Test connection state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    const current = getStoredApiKey();
    setSavedKey(current);
    setApiKeyInput(current);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) {
      handleClear();
      return;
    }

    setStoredApiKey(cleanKey);
    setSavedKey(cleanKey);
    setTestResult(null);
    setSaveMessage({ type: 'success', text: 'API Key 已成功保存到本地浏览器' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setSavedKey('');
    setApiKeyInput('');
    setTestResult(null);
    setSaveMessage({ type: 'info', text: '已清除本地保存的 API Key' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKeyInput.trim() || savedKey.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: '请先在输入框填入 Gemini API Key 后再测试连接',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testApiKeyConnection(keyToTest);
    setIsTesting(false);
    setTestResult(result);
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-ios-blue-bright hover:text-ios-blue-bright font-medium py-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回首页</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-ios-blue-bright" />
            <span>BYOK 密钥设置</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            自带密钥（Bring Your Own Key）：密钥只存在于你的本地设备，无服务器中转，安全私密。
          </p>
        </div>

        {/* Current Key Status Card */}
        <div className="p-4 rounded-2xl glass">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">当前存储状态</span>
            {savedKey ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已配置
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                未配置
              </span>
            )}
          </div>
          <div className="flex items-center justify-between glass-subtle px-3 py-2.5 rounded-lg font-mono text-sm">
            <span className={savedKey ? 'text-slate-200' : 'text-slate-500 italic text-xs'}>
              {savedKey ? maskApiKey(savedKey) : '暂无已保存的 Key'}
            </span>
            {savedKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
                title="清除保存的 Key"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Input Area */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="apiKey" className="block text-xs font-medium text-slate-300">
              粘贴 Gemini API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showPassword ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="例如：AIzaSy..."
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/15 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/60 focus:border-ios-blue/60 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? '隐藏明文' : '显示明文'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              保存在浏览器本地 localStorage，Key 标识为 <code className="text-slate-200 bg-white/10 px-1 py-0.5 rounded">gemini_api_key</code>
            </p>
          </div>

          {/* Action buttons: Save & Test Connection */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="submit"
              className="py-2.5 px-3 rounded-full bg-ios-blue hover:bg-ios-blue-bright text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md pressable"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存到本地</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || (!apiKeyInput.trim() && !savedKey.trim())}
              className={`py-2.5 px-3 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                isTesting || (!apiKeyInput.trim() && !savedKey.trim())
                  ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                  : 'bg-white/[0.08] hover:bg-white/[0.13] text-slate-100 border-white/10 cursor-pointer pressable'
              }`}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-ios-blue-bright" />
                  <span>正在验证...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-ios-blue-bright" />
                  <span>测试连接</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Save message prompt */}
        {saveMessage && (
          <div
            className={`p-3 rounded-[20px] text-xs border ${
              saveMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Test Connection Result Box */}
        {testResult && (
          <div
            className={`p-3.5 rounded-[20px] text-xs border space-y-1.5 ${
              testResult.success
                ? 'bg-emerald-950/50 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/50 text-rose-200 border-rose-500/40'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.details && (
                  <p className="text-[11px] opacity-80 mt-1 break-all font-mono">
                    {testResult.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Key Application Guide (Required by spec) */}
        <div className="p-4 rounded-2xl bg-ios-blue/[0.08] backdrop-blur-md border border-ios-blue/25 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ios-blue-bright">
            <HelpCircle className="w-4 h-4" />
            <span>如何获取免费 Gemini API Key？</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            请前往 Google AI Studio 申请免费密钥，免费层支持每日多达 1500 次常规请求及测试额度。
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-ios-blue-bright hover:text-ios-blue-bright underline font-medium pt-1"
          >
            <span>去 aistudio.google.com/apikey 申请免费 key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Security note */}
      <div className="p-3.5 rounded-[20px] glass-subtle flex items-start gap-2.5 text-xs text-slate-300">
        <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          安全声明：本产品为纯静态单页应用，API Key 仅保存在你的浏览器本地。任何音频对话流量直接与 Google 端点通信，绝无第三方服务器。
        </p>
      </div>
    </div>
  );
};
