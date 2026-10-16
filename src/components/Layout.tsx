import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isSettings = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-900 border-x border-slate-800 shadow-2xl relative">
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-slate-100 group-hover:text-indigo-300 transition-colors">
                ielts-speaking-examiner
              </h1>
              <p className="text-[11px] text-slate-400">AI 雅思考官口语模拟</p>
            </div>
          </Link>

          {!isSettings && (
            <Link
              to="/settings"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="设置 / BYOK"
              aria-label="设置页面"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col px-5 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-5 py-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
          <p>纯静态架构 · 本地 BYOK 隐私安全 · 无服务端</p>
        </footer>
      </div>
    </div>
  );
};
