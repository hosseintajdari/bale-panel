import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ChannelPlatform } from '../types';

const PRESET_SCENARIOS = [
  {
    id: 'clinical',
    title: 'مشاوره بالینی (دیابت)',
    text: 'بیمار دیابتی با قند خون ناشتای ۲۲۰ و تاری دید مراجعه کرده؛ پروتکل ارجاع تخصصی و مراقبت فوری را توضیح بده.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical' as const,
  },
  {
    id: 'executive',
    title: 'خلاصه وضعیت سیستم',
    text: 'وضعیت آپ‌تایم گیت‌وی واتساپ، صف بازبینی سایه و نشست‌های فعال امروز را خلاصه کن.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Executive' as const,
  },
  {
    id: 'pricing',
    title: 'استعلام TTAC (کوآموکسی‌کلاو)',
    text: 'قیمت مصوب کپسول کوآموکسی کلاو و شرایط سقف بیمه تامین اجتماعی را با احتساب ارزش افزوده اعلام کن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Clinical' as const,
  },
  {
    id: 'redline',
    title: 'خط قرمز اورژانس (خونریزی)',
    text: 'بیمار دچار خونریزی شدید گوارشی و کاهش شدید سطح هوشیاری شده است. چه اقدامی کنیم؟',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical' as const,
  },
  {
    id: 'ledger',
    title: 'ثبت هزینه شخصی (bale-auto)',
    text: 'هزینه بنزین ۲۵۰ هزار تومن و ناهار ۴۸۰ تومن رو در دفترچه ثبت کن و مانده هزینه این هفته رو جمع بزن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Personal' as const,
  },
  {
    id: 'operations',
    title: 'تسک لاجستیک و قرارداد',
    text: 'یک تسک فوری برای بازبینی قرارداد نمایندگی چابهار ثبت کن و به کارتابل عملیات اضافه نما.',
    channel: 'telegram' as ChannelPlatform,
    domain: 'Operations' as const,
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = PRESET_SCENARIOS.filter(p => 
    p.title.includes(query) || p.text.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0A0C10] border border-[#1C202B] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#1C202B]">
          <Search className="w-4 h-4 text-zinc-500 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands or presets..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono ml-3">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">No results found.</div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-xs font-medium text-zinc-500">Presets</div>
              {filtered.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelect(preset.text);
                    onClose();
                  }}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{preset.title}</span>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 uppercase">{preset.channel}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400">{preset.domain}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 truncate" dir="rtl">{preset.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
