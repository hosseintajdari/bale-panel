import React, { memo, useState } from 'react';
import { ChannelGatewayStatus, ChannelPlatform, GatewayPulseConfig } from '../types';
import { getLatencyHealth } from '../utils/healthAlerts';
import {
  PhoneCall,
  Radio,
  Send,
  MessageSquare,
  Zap,
  HeartPulse,
  RefreshCw,
  Flame,
  Sliders,
  History,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ChannelsStatusGridProps {
  channels: ChannelGatewayStatus[];
  activeChannel: string;
  setActiveChannel: (channel: ChannelPlatform) => void;
  pulseConfig?: GatewayPulseConfig;
  onTriggerPulsePing?: (mode?: 'simulate_spike') => void;
  onOpenSettings?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

const getChannelIcon = (id: string, className: string) => {
  switch (id) {
    case 'whatsapp':
      return <PhoneCall className={className} />;
    case 'bale':
      return <Radio className={className} />;
    case 'telegram':
      return <Send className={className} />;
    case 'sms':
      return <MessageSquare className={className} />;
    default:
      return <Zap className={className} />;
  }
};

const getChannelShortName = (id: string) => {
  switch (id) {
    case 'whatsapp':
      return 'واتساپ';
    case 'bale':
      return 'بله';
    case 'telegram':
      return 'تلگرام';
    case 'sms':
      return 'پیامک';
    default:
      return id;
  }
};

export const ChannelsStatusGrid = memo<ChannelsStatusGridProps>(({
  channels,
  activeChannel,
  setActiveChannel,
  pulseConfig,
  onTriggerPulsePing,
  onOpenSettings,
  onNavigateToTab,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handlePing = async (e: React.MouseEvent, mode?: 'simulate_spike') => {
    e.stopPropagation();
    if (isPinging || !onTriggerPulsePing) return;
    setIsPinging(true);
    setIsSimulatingSpike(mode === 'simulate_spike');
    try {
      await onTriggerPulsePing(mode);
    } finally {
      setTimeout(() => setIsPinging(false), 500);
    }
  };

  const isPulseActive = pulseConfig?.enabled ?? true;

  const alertCount = channels.filter((ch) => {
    const health = getLatencyHealth(ch.latencyMs, ch.telemetry?.jitterMs);
    return health.isAlert;
  }).length;

  return (
    <section className="bg-[#10141E] border border-[#1E2538] rounded-2xl p-2.5 shadow-sm transition-all">
      {/* Compact HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Channel Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/[0.04] text-xs text-zinc-400 font-mono">
            <HeartPulse className={`w-3.5 h-3.5 ${isPulseActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline text-[11px]">درگاه‌ها:</span>
          </div>

          {channels.map((ch) => {
            const isSelected = activeChannel === ch.id;
            const health = getLatencyHealth(ch.latencyMs, ch.telemetry?.jitterMs);

            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id as ChannelPlatform)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-[#141926] border-[#1F273B] text-zinc-300 hover:bg-[#1A2234] hover:border-[#2C3752]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${health.statusDotClass}`} />
                {getChannelIcon(ch.id, `w-3.5 h-3.5 ${isSelected ? 'text-sky-300' : 'text-zinc-400'}`)}
                <span className="font-medium">{getChannelShortName(ch.id)}</span>
                <span className="font-mono text-[11px] text-zinc-400 ltr:inline" dir="ltr">
                  {ch.latencyMs}ms
                </span>
                {ch.unprocessedQueue > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {ch.unprocessedQueue}
                  </span>
                )}
              </button>
            );
          })}

          {alertCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>{alertCount} هشدار تاخیر</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 mr-auto">
          {onTriggerPulsePing && (
            <>
              <button
                onClick={(e) => handlePing(e, isSimulatingSpike ? undefined : 'simulate_spike')}
                disabled={isPinging}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  isSimulatingSpike
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-[#141926] text-zinc-400 border-[#1F273B] hover:text-zinc-200 hover:bg-[#1A2234]'
                }`}
                title={isSimulatingSpike ? 'غیرفعال‌سازی شبیه‌سازی تاخیر' : 'شبیه‌سازی نوسان تاخیر'}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <button
                onClick={(e) => handlePing(e)}
                disabled={isPinging}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141926] hover:bg-[#1A2234] text-zinc-300 border border-[#1F273B] text-xs transition-all cursor-pointer"
                title="ارسال پالس آزمایشی پینگ"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isPinging ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-[11px]">پینگ</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141926] hover:bg-[#1A2234] text-zinc-300 border border-[#1F273B] text-xs transition-all cursor-pointer"
          >
            <span className="text-[11px]">جزئیات تله‌متری</span>
            {showDetails ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#141926] hover:bg-[#1A2234] text-zinc-400 hover:text-zinc-200 border border-[#1F273B] text-xs transition-all cursor-pointer"
              title="تنظیمات پالس"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('history')}
              className="p-1.5 rounded-lg bg-[#141926] hover:bg-[#1A2234] text-zinc-400 hover:text-indigo-300 border border-[#1F273B] text-xs transition-all cursor-pointer"
              title="دفتر وقایع گیت‌وی‌ها"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Technical Telemetry Panel (Collapsible) */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-[#1E2538] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          {channels.map((ch) => {
            const tel = ch.telemetry;
            const health = getLatencyHealth(ch.latencyMs, tel?.jitterMs);
            return (
              <div
                key={ch.id}
                className={`p-2.5 rounded-xl border bg-black/30 ${
                  activeChannel === ch.id ? 'border-sky-500/40' : 'border-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-zinc-200">{ch.displayName}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass}`}>
                    {health.persianLabel}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono truncate mb-2" title={ch.method}>
                  {ch.method}
                </div>
                {tel && (
                  <div className="space-y-1 font-mono text-[10px] text-zinc-400 bg-black/40 p-2 rounded-lg border border-white/[0.03]" dir="ltr">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">RTT / Jitter:</span>
                      <span className="text-zinc-200 font-bold">{ch.latencyMs}ms (±{tel.jitterMs}ms)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Ack Rate:</span>
                      <span className="text-emerald-400">{tel.webhookAckRatePct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Score / Loss:</span>
                      <span className="text-sky-300">{tel.healthScore}/100 ({tel.packetLossPct}%)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

ChannelsStatusGrid.displayName = 'ChannelsStatusGrid';

