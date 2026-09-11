import React from 'react';

interface PersianPayloadCardProps {
  content: string;
  className?: string;
  minHeight?: string;
}

export const PersianPayloadCard: React.FC<PersianPayloadCardProps> = ({
  content,
  className = '',
  minHeight = '90px'
}) => {
  return (
    <div
      dir="rtl"
      className={`p-3 rounded-lg bg-black/40 border border-[#1C202B] text-xs text-zinc-200 leading-relaxed font-sans ${className}`}
      style={{ minHeight }}
    >
      {content || 'پاسخ مدل یا قوانین قطعی در این بخش نمایش داده می‌شود.'}
    </div>
  );
};
