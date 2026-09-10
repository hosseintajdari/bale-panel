import React, { useState, memo } from 'react';
import { ChannelPlatform, PipelineTraceStep, ShadowReviewItem, GlobalPrivacySettings } from '../types';
import {
  Play,
  ArrowRight,
  ShieldAlert,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Layers,
  RefreshCw,
  Terminal,
  Send,
  Zap,
} from 'lucide-react';

interface PipelineConsoleProps {
  activeChannel: ChannelPlatform;
  environmentMode: 'shadow' | 'live';
  onProcessed: (record: ShadowReviewItem, trace: PipelineTraceStep[]) => void;
  onOpenShadowReview: () => void;
  privacySettings?: GlobalPrivacySettings;
  onOpenSettings?: () => void;
}

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

export const PipelineConsole = memo<PipelineConsoleProps>(({
  activeChannel,
  environmentMode,
  onProcessed,
  onOpenShadowReview,
}) => {
  const [inputText, setInputText] = useState(PRESET_SCENARIOS[0].text);
  const [selectedChannel, setSelectedChannel] = useState<ChannelPlatform>(activeChannel);
  const [selectedDomain, setSelectedDomain] = useState<'Executive' | 'Clinical' | 'Operations' | 'Personal'>('Clinical');
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestTrace, setLatestTrace] = useState<PipelineTraceStep[] | null>(null);
  const [latestRecord, setLatestRecord] = useState<ShadowReviewItem | null>(null);

  const handleRunPipeline = async (textToRun = inputText, channel = selectedChannel, domain = selectedDomain) => {
    if (!textToRun.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          senderId: `operator-${Math.floor(Math.random() * 1000)}`,
          senderDisplay: `مدیر سیستم (${channel.toUpperCase()})`,
          text: textToRun,
          domainContext: domain,
          environmentMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLatestRecord(data.shadowRecord);
        setLatestTrace(data.trace);
        onProcessed(data.shadowRecord, data.trace);
      }
    } catch (err) {
      console.error('Pipeline run error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunPipeline();
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Console Card */}
      <div className="bg-[#0A0C10] border border-[#1C202B] rounded-xl p-3.5 shadow-sm">
        
        {/* Preset Selector Bar */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1C202B] flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-mono text-zinc-500 shrink-0">Presets:</span>
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setInputText(preset.text);
                  setSelectedChannel(preset.channel);
                  setSelectedDomain(preset.domain);
                  handleRunPipeline(preset.text, preset.channel, preset.domain);
                }}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-all text-xs whitespace-nowrap cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as ChannelPlatform)}
              className="bg-[#10131A] border border-[#1C202B] rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer font-sans"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="bale">Bale</option>
              <option value="telegram">Telegram</option>
              <option value="sms">SMS</option>
            </select>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as any)}
              className="bg-[#10131A] border border-[#1C202B] rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer font-sans"
            >
              <option value="Clinical">Clinical</option>
              <option value="Executive">Executive</option>
              <option value="Operations">Operations</option>
              <option value="Personal">Personal Finance</option>
            </select>
          </div>
        </div>

        {/* Input Textarea & Run Action */}
        <div className="pt-3 relative">
          <div dir="rtl">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="متن پیام تست را وارد کنید (Ctrl+Enter برای اجرا)..."
              className="w-full bg-black/40 border border-[#1C202B] rounded-lg p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-sans resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-zinc-500 font-mono">
              Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400">Ctrl + Enter</kbd>
            </span>

            <button
              onClick={() => handleRunPipeline()}
              disabled={isProcessing || !inputText.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left: Execution Trace */}
        <div className="lg:col-span-7 bg-[#0A0C10] border border-[#1C202B] rounded-xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C202B]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-medium text-zinc-200">Execution Trace</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {latestTrace ? `${latestTrace.length} stages completed` : 'Awaiting execution'}
            </span>
          </div>

          <div className="space-y-1.5">
            {(latestTrace || [
              { stage: 'GATEWAY_INGEST', title: 'Gateway Ingest & Signature', status: 'passed', detail: 'Header verification & token validated', durationMs: 2 },
              { stage: 'ENVELOPE_NORMALIZE', title: 'Normalize UnifiedMessage', status: 'passed', detail: 'Messenger-agnostic envelope wrapping', durationMs: 1 },
              { stage: 'DETERMINISTIC_RULES', title: 'Deterministic Rules & Redlines', status: 'passed', detail: 'Catalog check & redlines passed', durationMs: 4 },
              { stage: 'SHADOW_EVALUATION', title: 'Shadow Mode Evaluation', status: 'warning', detail: 'BALE_LLM_MODE=shadow (Queued for review)', durationMs: 3 },
            ]).map((step, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {step.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {step.status === 'intercepted' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                    {step.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">{step.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{step.detail}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/[0.04]">
                  {step.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Response Preview */}
        <div className="lg:col-span-5 bg-[#0A0C10] border border-[#1C202B] rounded-xl p-3.5 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1C202B] mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <h3 className="text-xs font-medium text-zinc-200">Response Preview</h3>
              </div>
              {latestRecord && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  latestRecord.riskLevel === 'safe'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : latestRecord.riskLevel === 'high_redline'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {latestRecord.riskLevel === 'safe' ? 'SAFE' : latestRecord.riskLevel === 'high_redline' ? 'REDLINE' : 'MODERATE'}
                </span>
              )}
            </div>

            <div dir="rtl" className="p-3 rounded-lg bg-black/40 border border-[#1C202B] text-xs text-zinc-200 leading-relaxed font-sans min-h-[90px]">
              {latestRecord?.proposedReply || 'پاسخ مدل یا قوانین قطعی پس از اجرای خط لوله در این بخش نمایش داده می‌شود.'}
            </div>

            {latestRecord?.deterministicRuleApplied && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Deterministic: {latestRecord.deterministicRuleApplied}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#1C202B] flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              Status: <span className="text-zinc-300">{latestRecord?.status === 'approved' ? 'Approved (Live)' : 'Queued (Shadow)'}</span>
            </span>

            <button
              onClick={onOpenShadowReview}
              className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Shadow Queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
});

PipelineConsole.displayName = 'PipelineConsole';

