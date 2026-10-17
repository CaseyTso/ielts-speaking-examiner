import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Trash2,
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import {
  getPracticeReports,
  deletePracticeReport,
  PracticeReportRecord,
} from '../utils/storage';
import { downloadMarkdownReport } from '../lib/report';
import { MarkdownView } from '../components/MarkdownView';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PracticeReportRecord[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const list = getPracticeReports();
    setReports(list);
  };

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  const handleDownload = (e: React.MouseEvent, report: PracticeReportRecord) => {
    e.stopPropagation();
    downloadMarkdownReport(report);
  };

  const handleDelete = (id: string) => {
    deletePracticeReport(id);
    setDeleteConfirmId(null);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    loadReports();
    setNotification('报告已删除');
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // =========================================================================
  // VIEW: SINGLE REPORT DETAIL
  // =========================================================================
  if (selectedReport) {
    return (
      <div className="flex-1 flex flex-col space-y-4">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setSelectedReportId(null)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleDownload(e, selectedReport)}
              className="px-3 py-1.5 rounded-full bg-ios-blue/20 hover:bg-ios-blue/30 text-ios-blue-bright border border-ios-blue/30 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="下载 Markdown 原文档"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .md</span>
            </button>

            {deleteConfirmId === selectedReport.id ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedReport.id)}
                  className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-medium"
                >
                  确认删除
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedReport.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="删除此报告"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Metadata Header */}
        <div className="p-3.5 rounded-[20px] glass space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ios-blue-bright" />
              <span>{formatDate(selectedReport.createdAt)}</span>
            </div>
            {selectedReport.modelUsed && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                {selectedReport.modelUsed}
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-white leading-snug">
            {selectedReport.topicSummary}
          </h2>
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>雅思官方四评分维度 · 纯可执行反馈（不打分）</span>
          </div>
        </div>

        {/* Markdown Render Area */}
        <div className="flex-1 p-4 rounded-2xl glass overflow-y-auto">
          <MarkdownView content={selectedReport.markdown} />
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedReportId(null)}
            className="py-2 px-3 text-xs text-slate-400 hover:text-slate-200"
          >
            ← 返回报告列表
          </button>
          <button
            type="button"
            onClick={(e) => handleDownload(e, selectedReport)}
            className="py-2 px-4 rounded-full text-xs font-medium bg-ios-blue hover:bg-ios-blue-bright text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载此份 Markdown 报告</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: REPORTS LIST
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-ios-blue/10 text-ios-blue-bright border border-ios-blue/20">
              <Sparkles className="w-3 h-3" />
              <span>Practice Reports</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              练习报告历史记录
            </h2>
            <p className="text-xs text-slate-400">
              查看以往模考的逐题诊断、地道改写与跨维度系统总结。
            </p>
          </div>

          <Link
            to="/exam"
            className="px-3.5 py-1.5 rounded-full bg-ios-blue hover:bg-ios-blue-bright text-white text-xs font-medium flex items-center gap-1 transition-colors shrink-0 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>开始模考</span>
          </Link>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Empty State */}
        {reports.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl glass space-y-3">
            <div className="w-12 h-12 rounded-2xl glass-subtle text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">暂无练习报告</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                在考官模式（Exam Mode）完成全流程模考后，系统将自动基于转录生成双层结构的练习报告并归档于此。
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/exam')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ios-blue hover:bg-ios-blue-bright text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>进入考官模式练习</span>
            </button>
          </div>
        ) : (
          /* Report Cards List */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>已保存 {reports.length} 份练习报告</span>
              <span>点击卡片查看完整报告</span>
            </div>

            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className="p-3.5 rounded-[20px] glass-subtle hover:bg-white/[0.09] hover:border-white/20 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-ios-blue-bright shrink-0" />
                      <span>{formatDate(report.createdAt)}</span>
                      {report.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                          {report.modelUsed}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleDownload(e, report)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-ios-blue-bright hover:bg-slate-800 transition-colors"
                        title="下载 Markdown 原文档"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {deleteConfirmId === report.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(report.id)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-medium"
                          >
                            确认
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(report.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="删除报告"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-ios-blue-bright transition-colors line-clamp-1">
                      {report.topicSummary}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-ios-blue-bright transition-colors shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-white/10">
        <Link
          to="/"
          className="w-full py-2.5 px-4 rounded-full font-medium text-xs text-slate-300 hover:text-white hover:bg-white/[0.07] text-center block transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
};
