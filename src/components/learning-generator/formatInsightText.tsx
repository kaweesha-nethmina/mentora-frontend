import React from "react";

export const formatInsightText = (text: string) => {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  return paragraphs.map((para, idx) => {
    const trimmed = para.trim();
    const bulletMatch = trimmed.match(/^(\d+\.\s|[-*•]\s)/);
    const isList = bulletMatch !== null;
    const bullet = isList ? bulletMatch![1] : '';
    const content = isList ? trimmed.substring(bullet.length) : trimmed;

    const parts: React.ReactNode[] = [];
    const segments = content.split(/(\*\*[^*]+\*\*)/g);

    segments.forEach((seg, segIdx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        parts.push(
          <span key={`${idx}-${segIdx}`} className="text-teal-700 dark:text-teal-300 font-bold">
            {seg.slice(2, -2)}
          </span>
        );
      } else {
        parts.push(<span key={`${idx}-${segIdx}`}>{seg}</span>);
      }
    });

    return (
      <div key={idx} className={`${idx > 0 ? 'mt-3' : ''} ${isList ? 'flex gap-2 items-start' : ''}`}>
        {isList && (
          <span className="text-teal-500 font-bold shrink-0 text-xs mt-0.5">{typeof bullet === 'string' ? bullet.replace(/\s$/, '') : bullet}</span>
        )}
        <span className="text-sm text-[var(--lmg-text-primary)] leading-relaxed">{parts}</span>
      </div>
    );
  });
};
