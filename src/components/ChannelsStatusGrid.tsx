import React from 'react';
import { ChannelGatewayStatus, ChannelPlatform, GatewayPulseConfig } from '../types';
import { getLatencyHealth, LATENCY_THRESHOLDS } from '../utils/healthAlerts';
import {
  MessageSquare,
  PhoneCall,
  Radio,
  Send,
  Zap,
  HeartPulse,
  Activity,
  Sliders,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Gauge,
  Flame,
  History,
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

export const ChannelsStatusGrid: React.FC<ChannelsStatusGridProps> = ({
  channels,
  activeChannel,
  setActiveChannel,
  pulseConfig,
  onTriggerPulsePing,
  onOpenSettings,
  onNavigateToTab,
}) => {
  const [isPinging, setIsPinging] = React.useState(false);
  const [isSimulatingSpike, setIsSimulatingSpike] = React.useState(false);

  const handlePing = async (e: React.MouseEvent, mode?: 'simulate_spike') => {
    e.stopPropagation();
    if (isPinging || !onTriggerPulsePing) return;
    setIsPinging(true);
    if (mode === 'simulate_spike') {
      setIsSimulatingSpike(true);
    } else {
      setIsSimulatingSpike(false);
    }
    try {
      await onTriggerPulsePing(mode);
    } finally {
      setTimeout(() => setIsPinging(false), 600);
    }
  };

  // Dynamic icon generator: adapts color based on connection latency health alert tier
  const getIcon = (id: string, iconColorClass: string) => {
    switch (id) {
      case 'whatsapp':
        return <PhoneCall className={`w-4 h-4 transition-colors duration-300 ${iconColorClass}`} />;
      case 'bale':
        return <Radio className={`w-4 h-4 transition-colors duration-300 ${iconColorClass}`} />;
      case 'telegram':
        return <Send className={`w-4 h-4 transition-colors duration-300 ${iconColorClass}`} />;
      case 'sms':
        return <MessageSquare className={`w-4 h-4 transition-colors duration-300 ${iconColorClass}`} />;
      default:
        return <Zap className={`w-4 h-4 transition-colors duration-300 ${iconColorClass}`} />;
    }
  };

  const getPriorityBadge = (id: string) => {
    switch (id) {
      case 'whatsapp':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            اولویت ۱ (کاربر نهایی)
          </span>
        );
      case 'bale':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
            اولویت ۲ (بومی ایران)
          </span>
        );
      case 'telegram':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
            اولویت ۲ (ربات استاندارد)
          </span>
        );
      case 'sms':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            فال‌بک و الرت اضطراری
          </span>
        );
      default:
        return null;
    }
  };

  const isPulseActive = pulseConfig?.enabled ?? true;

  // Identify channels with active high-latency warnings or critical alerts
  const alertChannels = channels.map((ch) => {
    const isGwEnabled = isPulseActive && (pulseConfig?.gateways[ch.id as ChannelPlatform] ?? true);
    const health = getLatencyHealth(ch.latencyMs, ch.telemetry?.jitterMs);
    return { channel: ch, health, isGwEnabled };
  }).filter((item) => item.health.isAlert);

  return (
    <div className="space-y-2.5">
      {/* Visual Health Alert Notice Banner (appears when high latency is detected) */}
      {alertChannels.length > 0 && (
        <div className="px-3.5 py-2 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 space-x-reverse text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <span className="font-medium">
              سیستم هشدار بصری سلامت: {alertChannels.length} درگاه با تاخیر بالا یا وضعیت بحرانی شناسایی شد:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {alertChannels.map(({ channel, health }) => (
                <span
                  key={channel.id}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${health.badgeClass} font-semibold`}
                >
                  {channel.displayName}: {channel.latencyMs}ms ({health.persianLabel})
                </span>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-amber-400/80 font-mono">
            رنگ آیکون‌های درگاه‌ها متناسب با تاخیر تغییر یافت.
          </div>
        </div>
      )}

      {/* Pulse & Health Threshold Telemetry Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-zinc-400 font-mono">
        <div className="flex flex-wrap items-center space-x-2.5 space-x-reverse">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <HeartPulse
              className={`w-4 h-4 ${
                isPulseActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
              }`}
            />
            <span className="text-zinc-200 font-semibold font-sans text-xs">
              پایش پالس و سلامت اتصالات (Latency Health System):
            </span>
          </div>

          {/* Latency Thresholds Visual Legend */}
          <div className="flex items-center space-x-2 space-x-reverse bg-black/30 px-2.5 py-1 rounded-xl border border-white/[0.04] text-[10px]">
            <span className="text-zinc-400">آستانه‌های تاخیر:</span>
            <div className="flex items-center space-x-1 space-x-reverse" title="کمتر از ۵۰ میلی‌ثانیه">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300">عالی (&lt;50ms)</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center space-x-1 space-x-reverse" title="بین ۵۰ تا ۹۰ میلی‌ثانیه">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-sky-300">پایدار (50-89ms)</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center space-x-1 space-x-reverse" title="بین ۹۰ تا ۱۴۰ میلی‌ثانیه: هشدار تاخیر">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-medium">هشدار تاخیر (90-139ms)</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center space-x-1 space-x-reverse" title="بیش از ۱۴۰ میلی‌ثانیه: وضعیت بحرانی">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-bold">بحرانی (&ge;140ms)</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Pulse Ping, Simulate Spike Alert, Settings */}
        <div className="flex items-center space-x-2 space-x-reverse self-end lg:self-auto">
          {isPulseActive && onTriggerPulsePing && (
            <>
              <button
                onClick={(e) => handlePing(e, isSimulatingSpike ? undefined : 'simulate_spike')}
                disabled={isPinging}
                className={`flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-xl text-[10px] transition-all cursor-pointer font-medium border ${
                  isSimulatingSpike
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/35 hover:bg-rose-500/30'
                    : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
                title="تغییر مصنوعی تاخیر برای تست هشدارهای بصری آیکون‌ها"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{isSimulatingSpike ? 'بازگشت به تاخیر نرمال' : 'تست شبیه‌سازی تاخیر'}</span>
              </button>

              <button
                onClick={(e) => handlePing(e)}
                disabled={isPinging}
                className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer text-[10px] font-medium"
                title="ارسال پالس آزمایشی و محاسبه تاخیر بلادرنگ"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'در حال پینگ...' : 'پالس پینگ بلادرنگ'}</span>
              </button>
            </>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer text-[10px]"
              title="تنظیمات پایش پالس و حریم خصوصی"
            >
              <Sliders className="w-3 h-3" />
              <span>تنظیمات</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('history')}
              className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer text-[10px] font-medium"
              title="مشاهده دفتر وقایع و تاریخچه حسابرسی گیت‌وی‌ها"
            >
              <History className="w-3 h-3" />
              <span>لاگ حسابرسی</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of 4 Gateway Cards with Health Alert Visual Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {channels.map((ch) => {
          const isSelected = activeChannel === ch.id;
          const isGatewayTelemetryEnabled =
            isPulseActive && (pulseConfig?.gateways[ch.id as ChannelPlatform] ?? true);
          const tel = ch.telemetry;

          // Compute visual health alerts dynamically based on latencyMs thresholds
          const health = getLatencyHealth(ch.latencyMs, tel?.jitterMs);

          return (
            <div
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as any)}
              className={`group relative p-3.5 rounded-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                isSelected
                  ? 'bg-white/[0.08] border-2 border-white/[0.3] shadow-[0_8px_28px_rgba(0,0,0,0.35)]'
                  : health.isAlert
                  ? `bg-white/[0.03] ${health.cardBorderHighlight} hover:bg-white/[0.06]`
                  : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
              }`}
            >
              {/* Top Bar: Icon + Gateway Name + Health Alert Status Beacon */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2 space-x-reverse">
                  
                  {/* Status Icon Box with Latency Health Alert Color Styling */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-inner transition-all duration-300 ${health.containerBgClass} ${health.containerBorderClass}`}
                    title={`وضعیت اتصال: ${health.persianLabel} (${ch.latencyMs}ms)`}
                  >
                    {getIcon(ch.id, health.iconColorClass)}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-white font-sans block leading-tight">
                      {ch.displayName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-zinc-400 font-mono uppercase">
                        {ch.id} GATE
                      </span>
                      {/* Visual Health Alert Level Badge */}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass} flex items-center gap-0.5`}
                      >
                        {health.level === 'critical' ? (
                          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                        ) : health.level === 'warning' ? (
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        )}
                        <span>{health.persianLabel}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Status Beacon */}
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  {isGatewayTelemetryEnabled && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        health.level === 'critical'
                          ? 'bg-rose-500 animate-ping'
                          : health.level === 'warning'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400 animate-ping'
                      }`}
                      title="پالس بلادرنگ فعال"
                    />
                  )}
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${health.statusDotClass}`}
                    title={`تاخیر: ${ch.latencyMs}ms - ${health.persianLabel}`}
                  />
                </div>
              </div>

              {/* Middle: Method Description */}
              <div className="text-[11px] text-zinc-400 font-mono mb-2 truncate">
                {ch.method}
              </div>

              {/* Detailed Real-Time Telemetry Strip (when Pulse Check is enabled for this gateway) */}
              {isGatewayTelemetryEnabled && tel ? (
                <div
                  className={`mb-2 p-2 rounded-xl border transition-all duration-300 space-y-1.5 ${
                    health.isAlert ? 'bg-black/40 border-white/[0.08]' : 'bg-black/25 border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center space-x-1 space-x-reverse text-zinc-300">
                      <Activity className={`w-3 h-3 ${health.iconColorClass}`} />
                      <span>پینگ:</span>
                      <span className={`font-bold ${health.iconColorClass}`}>{ch.latencyMs}ms</span>
                      <span className="text-zinc-400 text-[9px]">
                        (±{tel.jitterMs}ms)
                      </span>
                    </div>
                    <span className="text-sky-300 text-[9px]">
                      Ack: {tel.webhookAckRatePct}%
                    </span>
                  </div>

                  {/* Micro metric bar */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 border-t border-white/[0.04] pt-1">
                    <span>افت: {tel.packetLossPct}%</span>
                    <span>سلامت: {tel.healthScore}/100</span>
                    <span>KeepAlive: {tel.keepAliveSec}s</span>
                  </div>
                </div>
              ) : isPulseActive && !isGatewayTelemetryEnabled ? (
                <div className="mb-2 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] font-mono text-zinc-400 text-center">
                  تله‌متری تفکیکی غیرفعال است
                </div>
              ) : null}

              {/* Bottom Meta with Visual Latency Warning */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-zinc-400 font-mono">
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  <span>تاخیر اتصال:</span>
                  <span className={`font-bold transition-colors duration-300 ${health.iconColorClass}`}>
                    {ch.latencyMs}ms
                  </span>
                  {health.isAlert && (
                    <span className="text-[9px] text-amber-400 font-sans font-semibold">
                      (هشدار)
                    </span>
                  )}
                </div>
                {getPriorityBadge(ch.id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
