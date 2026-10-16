import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const html = useMemo(() => {
    try {
      return marked.parse(content, { async: false, gfm: true, breaks: true }) as string;
    } catch (err) {
      console.error('Failed to parse markdown:', err);
      return `<div class="whitespace-pre-wrap font-mono text-xs text-slate-300">${content}</div>`;
    }
  }, [content]);

  return (
    <div
      className={`markdown-body text-slate-200 text-xs sm:text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
