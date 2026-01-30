'use client';

import { useEffect, useState } from 'react';

interface SummaryDisplayProps {
  content: string;
  title: string;
}

export function SummaryDisplay({ content, title }: SummaryDisplayProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Simple markdown to HTML conversion
    // In production, you might want to use a proper markdown library
    const converted = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-600 dark:text-gray-400">$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-2">$&</ul>')
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p class="my-2">')
      // Single newlines to br
      .replace(/\n/g, '<br />');

    setHtml(`<p class="my-2">${converted}</p>`);
  }, [content]);

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">AI-Generated Summary</p>
      </div>

      <article
        className="prose prose-gray dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
