import React, { useState } from 'react';
import { ChannelPlatform, PipelineTraceStep, ShadowReviewItem, GlobalPrivacySettings } from '../types';
import { Play, ArrowRight, ShieldAlert, Shield, Cpu, CheckCircle2, AlertTriangle, Layers, Send, RefreshCw, Terminal, Eye, ShieldCheck, Database, Sliders } from 'lucide-react';

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
    title: 'مشاوره بالینی محرمانه (High-Privacy Medical Bot - Ephemeral)',
    text: 'بیمار دیابتی با قند خون ناشتای ۲۲۰ و تاری دید مراجعه کرده؛ پروتکل ارجاع تخصصی و مراقبت فوری را توضیح بده.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    title: 'مدیریت ارشد: خلاصه عملکرد Embednet OS',
    text: 'وضعیت آپ‌تایم گیت‌وی واتساپ، صف بازبینی سایه و نشست‌های فعال امروز را خلاصه کن.',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Executive',
  },
  {
    title: 'محاسبه قطعی قیمت دارو (قانون قیمت و TTAC)',
    text: 'قیمت مصوب کپسول کوآموکسی کلاو و شرایط سقف بیمه تامین اجتماعی را با احتساب ارزش افزوده اعلام کن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    title: 'خط قرمز بالینی اورژانس (ADR-0002 Redline)',
    text: 'بیمار دچار خونریزی شدید گوارشی و کاهش شدید سطح هوشیاری شده است. چه اقدامی کنیم؟',
    channel: 'whatsapp' as ChannelPlatform,
    domain: 'Clinical',
  },
  {
    title: 'یادداشت و حساب‌کتاب شخصی (bale-auto Zero-Retention)',
    text: 'هزینه بنزین ۲۵۰ هزار تومن و ناهار ۴۸۰ تومن رو در دفترچه ثبت کن و مانده هزینه این هفته رو جمع بزن.',
    channel: 'bale' as ChannelPlatform,
    domain: 'Personal',
  },
  {
    title: 'عملیات و لاجستیک: تخصیص وظایف و ثبت سشن',
    text: 'یک تسک فوری برای بازبینی قرارداد نمایندگی چابهار ثبت کن و به کارتابل عملیات اضافه نما.',
    channel: 'telegram' as ChannelPlatform,
    domain: 'Operations',
  },
];

export const PipelineConsole: React.FC<PipelineConsoleProps> = ({
  activeChannel,
  environmentMode,
  onProcessed,
  onOpenShadowReview,
  privacySettings,
  onOpenSettings,
}) => {
  const [inputText, setInputText] = useState(PRESET_SCENARIOS[0].text);
  const [selectedChannel, setSelectedChannel] = useState<ChannelPlatform>(activeChannel);
  const [selectedDomain, setSelectedDomain] = useState<'Executive' | 'Clinical' | 'Operations' | 'Personal'>('Executive');
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

  return (
    <div className="space-y-4">
      {/* Top Workspace Bar */}
      <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
        
        {/* Scenario Presets Pill Carousel */}
        <div className="flex items-center space-x-2 pb-3 overflow-x-auto border-b border-white/[0.05] text-xs">
          <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap mr-2">سناریوهای سریع:</span>
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset.text);
                setSelectedChannel(preset.channel);
                setSelectedDomain(preset.domain as any);
                handleRunPipeline(preset.text, preset.channel, preset.domain as any);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.09] hover:border-white/[0.14] text-zinc-300 transition-all text-xs font-sans whitespace-nowrap cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Global Privacy Retention Status Strip */}
        <div className="flex items-center justify-between py-2 px-3 my-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs">
          <div className="flex items-center space-x-2 space-x-reverse">
            {privacySettings?.retentionPolicy === 'ephemeral' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <div className="flex items-center gap-2">
              <span className="text-zinc-200 text-xs font-medium">
                {privacySettings?.retentionPolicy === 'ephemeral'
                  ? 'سیاست حریم خصوصی حداکثری (Zero-Retention Ephemeral):'
                  : 'سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit):'}
              </span>
              <span className="text-[11px] text-zinc-400 hidden md:inline">
                {privacySettings?.retentionPolicy === 'ephemeral'
                  ? 'سشن‌های بالینی و پزشکی در RAM پردازش شده و هیچ متادیتایی در دفتر کار ذخیره نمی‌گردد.'
                  : 'متادیتای تعاملات و بار پردازشی نشست‌ها در کارتابل دفتر کار ثبت می‌شود.'}
              </span>
            </div>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1 space-x-reverse text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 rounded-xl border border-white/[0.08]"
            >
              <Sliders className="w-3 h-3" />
              <span>تغییر در تنظیمات</span>
            </button>
          )}
        </div>

        {/* Input & Dispatcher Controls */}
        <div className="pt-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-zinc-300 font-sans">پیام شبیه‌سازی‌شده ورودی:</label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                دریافت از {selectedChannel.toUpperCase()}
              </span>
            </div>

            {/* Selector Options */}
            <div className="flex items-center space-x-2 text-xs">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as any)}
                className="bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="whatsapp">کانال: WhatsApp (اولویت ۱)</option>
                <option value="bale">کانال: Bale Messenger</option>
                <option value="telegram">کانال: Telegram Bot</option>
                <option value="sms">کانال: SMS Gateway</option>
              </select>

              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="Executive">پروفایل: مدیریت ارشد و هماهنگی</option>
                <option value="Clinical">پروفایل: بالینی و رگولاتوری دارویی</option>
                <option value="Operations">پروفایل: عملیات، فاکتور و تریاژ</option>
                <option value="Personal">پروفایل: اتوماسیون شخصی</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="متن پیام ورودی از سمت کاربر را وارد کنید..."
              className="w-full bg-black/50 border border-white/[0.08] rounded-2xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all font-sans resize-none"
            />
            <button
              onClick={() => handleRunPipeline()}
              disabled={isProcessing || !inputText.trim()}
              className="absolute bottom-3 left-3 px-4 py-1.5 rounded-xl bg-white/[0.12] hover:bg-white/[0.2] border border-white/[0.15] text-white text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>اجرای خط لوله (Run Pipeline)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Inspector: Trace Pipeline vs Normalized Envelope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Trace Stages (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-white tracking-tight">
                ردیابی گام‌به‌گام خط لوله پردازش (Pipeline Execution Trace)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {latestTrace ? `${latestTrace.length} مرحله اجرا شد` : 'در انتظار اجرا'}
            </span>
          </div>

          <div className="space-y-2">
            {(latestTrace || [
              { stage: 'GATEWAY_INGEST', title: 'دریافت وب‌هوک خام و تایید امضا', status: 'passed', detail: 'اعتبارسنجی توکن و هدرهای پیام‌رسان', durationMs: 3 },
              { stage: 'ENVELOPE_NORMALIZE', title: 'عادی‌سازی به پاکت یکپارچه (UnifiedMessage)', status: 'passed', detail: 'حذف وابستگی کدهای کسب‌وکار به سوکت‌های پیام‌رسان', durationMs: 2 },
              { stage: 'DETERMINISTIC_RULES', title: 'غربال قوانین صلب و گیت‌های ایمنی', status: 'passed', detail: 'بررسی عدم تضاد با کاتالوگ، تعرفه و خطوط قرمز', durationMs: 5 },
              { stage: 'SHADOW_EVALUATION', title: 'حالت سایه و ارزیابی پاسخ پیش از ارسال', status: 'warning', detail: 'BALE_LLM_MODE=shadow (پاسخ در صف بازبینی ثبت شد)', durationMs: 4 },
            ]).map((step, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all text-xs"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">
                    {step.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {step.status === 'intercepted' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                    {step.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">{step.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 font-sans">{step.detail}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04]">
                  {step.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Envelope & Proposed Response (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-semibold text-white tracking-tight">
                  پاسخ تولیدی در حالت سایه (Shadow Inference)
                </h3>
              </div>
              {latestRecord && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  latestRecord.riskLevel === 'safe'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : latestRecord.riskLevel === 'high_redline'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {latestRecord.riskLevel === 'safe' ? 'ایمن' : latestRecord.riskLevel === 'high_redline' ? 'خط قرمز' : 'ریسک متوسط'}
                </span>
              )}
            </div>

            {/* Proposed Content */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.07] text-xs text-zinc-200 leading-relaxed font-sans">
              {latestRecord?.proposedReply || 'پاسخ پس از اجرای خط لوله در این بخش نمایان می‌شود. در صورت فعال بودن حالت سایه، پیام قبل از ارسال نیازمند تایید شما در پنل است.'}
            </div>

            {latestRecord?.deterministicRuleApplied?.includes('ZERO_RETENTION') ? (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                <span>سیاست Zero-Retention (bale-auto): بدون ذخیره‌سازی متن خام شخصی / پاسخ آنی</span>
              </div>
            ) : latestRecord?.deterministicRuleApplied ? (
              <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>قانون صلب قطعی: {latestRecord.deterministicRuleApplied}</span>
              </div>
            ) : null}
          </div>

          {/* Quick Action to Shadow Review */}
          <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-sans">
              وضعیت: <span className="text-zinc-300">
                {latestRecord?.status === 'approved' ? 'تایید و ارسال شده (Live)' : 'در صف نظارت مدیر'}
              </span>
            </span>

            <button
              onClick={onOpenShadowReview}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>مشاهده در صف بازبینی سایه</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
