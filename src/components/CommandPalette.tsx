import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, Terminal, Activity, MessageSquare } from 'lucide-react';
import { ChannelPlatform } from '../types';
import { useAppStore } from '../store/useAppStore';

const PRESET_SCENARIOS = [
  {
    id: 'clinical',
    title: 'مشاوره بالینی (دیابت)',
    text: 'بیمار دیابتی با قند خون ناشتای ۲۲۰ و تاری دید مراجعه کرده؛ پروتکل ارجاع تخصصی و مراقبت فوری را توضیح بده.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    id: 'executive',
    title: 'خلاصه وضعیت سیستم',
    text: 'وضعیت آپ‌تایم گیت‌وی واتساپ، صف بازبینی سایه و نشست‌های فعال امروز را خلاصه کن.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Executive',
  },
  {
    id: 'pricing',
    title: 'استعلام TTAC (کوآموکسی‌کلاو)',
    text: 'قیمت مصوب کپسول کوآموکسی کلاو و شرایط سقف بیمه تامین اجتماعی را با احتساب ارزش افزوده اعلام کن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    id: 'redline',
    title: 'خط قرمز اورژانس (خونریزی)',
    text: 'بیمار دچار خونریزی شدید گوارشی و کاهش شدید سطح هوشیاری شده است. چه اقدامی کنیم؟',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    id: 'ledger',
    title: 'ثبت هزینه شخصی (bale-auto)',
    text: 'هزینه بنزین ۲۵۰ هزار تومن و ناهار ۴۸۰ تومن رو در دفترچه ثبت کن و مانده هزینه این هفته رو جمع بزن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Personal',
  },
  {
    id: 'operations',
    title: 'تسک لاجستیک و قرارداد',
    text: 'یک تسک فوری برای بازبینی قرارداد نمایندگی چابهار ثبت کن و به کارتابل عملیات اضافه نما.',
    channel: 'telegram' as ChannelPlatform,
    domain: 'Operations',
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const { setActiveChannel, triggerPulsePing } = useAppStore();

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/80 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <Command
          className="w-full bg-[#0A0C10] border border-[#1C202B] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
          shouldFilter={true}
        >
          <div className="flex items-center px-4 py-3 border-b border-[#1C202B]">
            <Search className="w-4 h-4 text-zinc-500 mr-3 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search commands, presets, or gateways..."
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none w-full"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono ml-3 shrink-0">ESC</kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="p-4 text-center text-sm text-zinc-500">No results found.</Command.Empty>

            <Command.Group heading="System Commands" className="text-xs font-medium text-zinc-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mb-1">
              <Command.Item
                onSelect={() => { triggerPulsePing('simulate_spike'); onClose(); }}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-white/[0.04] aria-selected:bg-white/[0.04] text-zinc-200 transition-colors cursor-pointer data-[selected=true]:bg-white/[0.06]"
              >
                <Activity className="w-4 h-4 mr-2 text-sky-400" />
                <span>Simulate Gateway Spike (Ping)</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Switch Gateway" className="text-xs font-medium text-zinc-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mb-1 mt-2">
              <Command.Item
                onSelect={() => { setActiveChannel('whatsapp'); onClose(); }}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-white/[0.04] aria-selected:bg-white/[0.04] text-zinc-200 transition-colors cursor-pointer data-[selected=true]:bg-white/[0.06]"
              >
                <MessageSquare className="w-4 h-4 mr-2 text-emerald-400" />
                <span>WhatsApp Multi-Device</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { setActiveChannel('bale'); onClose(); }}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-white/[0.04] aria-selected:bg-white/[0.04] text-zinc-200 transition-colors cursor-pointer data-[selected=true]:bg-white/[0.06]"
              >
                <MessageSquare className="w-4 h-4 mr-2 text-sky-400" />
                <span>Bale Messenger</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Prompt Presets" className="text-xs font-medium text-zinc-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mb-1 mt-2">
              {PRESET_SCENARIOS.map(preset => (
                <Command.Item
                  key={preset.id}
                  value={`${preset.title} ${preset.text} ${preset.channel}`}
                  onSelect={() => {
                    setActiveChannel(preset.channel);
                    onSelect(preset.text);
                    onClose();
                  }}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] aria-selected:bg-white/[0.04] transition-colors cursor-pointer group data-[selected=true]:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between mb-1 w-full">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{preset.title}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 uppercase">{preset.channel}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400">{preset.domain}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 truncate w-full" dir="rtl">{preset.text}</span>
                </Command.Item>
              ))}
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  );
};
