import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Sparkles, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isSettings = location.pathname === '/settings';
  const isHistory = location.pathname === '/history';

  return (
    <div className="min-h-screen bg-[#05070C] text-slate-100 flex justify-center selection:bg-ios-blue/30 selection:text-blue-100 relative overflow-x-hidden">
      {/* Ambient light orbs — barely-there cool blue, Liquid Glass philosophy:
          the glass itself is colorless; light gives it presence */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[420px] rounded-full bg-[#0A84FF]/25 blur-[130px]" />
        <div className="absolute top-2/3 -left-32 w-[360px] h-[360px] rounded-full bg-[#409CFF]/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-24 w-[400px] h-[400px] rounded-full bg-[#64D2FF]/12 blur-[130px]" />
      </div>

      <div className="w-full max-w-md min-h-screen flex flex-col border-x border-white/[0.06] relative z-10">
        {/* Top Header */}
        <header className="px-5 py-4 glass-strong sticky top-0 z-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-ios-blue flex items-center justify-center text-white font-bold shadow-lg shadow-ios-blue/40 group-hover:bg-ios-blue-bright transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-slate-100 group-hover:text-ios-blue-bright transition-colors">
                ielts-speaking-examiner
              </h1>
              <p className="text-[11px] text-slate-400">AI 雅思考官口语模拟</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {!isHistory && (
              <Link
                to="/history"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="练习报告历史记录"
                aria-label="历史记录"
              >
                <History className="w-5 h-5" />
              </Link>
            )}

            {!isSettings && (
              <Link
                to="/settings"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="设置 / BYOK"
                aria-label="设置页面"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col px-5 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-5 py-4 border-t border-white/[0.06] text-center text-xs text-slate-400">
          <p>纯静态架构 · 本地 BYOK 隐私安全 · 无服务端</p>
        </footer>
      </div>
    </div>
  );
};
