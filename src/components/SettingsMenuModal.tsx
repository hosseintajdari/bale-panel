import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  EyeOff,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  HeartPulse,
  Sliders,
  Activity,
  PhoneCall,
  Radio,
  Send,
  MessageSquare,
  Zap,
  Gauge,
  Wifi,
  Sparkles,
} from 'lucide-react';
import {
  GlobalPrivacySettings,
  DataRetentionPolicy,
  GatewayPulseConfig,
  ChannelGatewayStatus,
  ChannelPlatform,
} from '../types';
import { getLatencyHealth } from '../utils/healthAlerts';

interface SettingsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  privacySettings: GlobalPrivacySettings;
  onUpdatePrivacySettings: (newSettings: GlobalPrivacySettings) => void;
  onNavigateToTab?: (tab: any) => void;
  pulseConfig?: GatewayPulseConfig;
  onUpdatePulseConfig?: (newConfig: GatewayPulseConfig) => void;
  channels?: ChannelGatewayStatus[];
  onTriggerPulsePing?: () => Promise<void>;
}

const DEFAULT_PULSE_CONFIG: GatewayPulseConfig = {
  enabled: true,
  gateways: {
    whatsapp: true,
    bale: true,
    telegram: true,
    sms: true,
  },
  refreshIntervalSec: 3,
  alertOnJitterThresholdMs: 40,
  lastCheckedAt: 'هم‌اکنون',
};

export const SettingsMenuModal: React.FC<SettingsMenuModalProps> = ({
  isOpen,
  onClose,
  privacySettings,
  onUpdatePrivacySettings,
  onNavigateToTab,
  pulseConfig,
  onUpdatePulseConfig,
  channels = [],
  onTriggerPulsePing,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [localPulseConfig, setLocalPulseConfig] = useState<GatewayPulseConfig>(
    pulseConfig || DEFAULT_PULSE_CONFIG
  );

  useEffect(() => {
    if (pulseConfig) {
      setLocalPulseConfig(pulseConfig);
    }
  }, [pulseConfig]);

  if (!isOpen) return null;

  // Toggle Master Pulse Check switch
  const handleTogglePulseMaster = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const newEnabled = !localPulseConfig.enabled;
    const updatedConfig: GatewayPulseConfig = {
      ...localPulseConfig,
      enabled: newEnabled,
      lastCheckedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setLocalPulseConfig(updatedConfig);

    try {
      const res = await fetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config) {
        if (onUpdatePulseConfig) onUpdatePulseConfig(data.config);
        setSaveSuccessMsg(
          newEnabled
            ? 'پایش پالس (Pulse Check) و تله‌متری بلادرنگ درگاه‌ها فعال شد.'
            : 'پایش پالس غیرفعال شد (حالت سبک بدون سنجش دوره‌ای).'
        );
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Failed to toggle pulse master:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Pulse Telemetry for a specific individual gateway
  const handleToggleGatewayTelemetry = async (gatewayId: ChannelPlatform) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const currentVal = localPulseConfig.gateways[gatewayId] ?? true;
    const updatedGateways = {
      ...localPulseConfig.gateways,
      [gatewayId]: !currentVal,
    };
    const updatedConfig: GatewayPulseConfig = {
      ...localPulseConfig,
      gateways: updatedGateways,
      lastCheckedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setLocalPulseConfig(updatedConfig);

    try {
      const res = await fetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config) {
        if (onUpdatePulseConfig) onUpdatePulseConfig(data.config);
        const nameMap: Record<ChannelPlatform, string> = {
          whatsapp: 'واتساپ (WhatsApp)',
          bale: 'بله (Bale)',
          telegram: 'تلگرام (Telegram)',
          sms: 'پیامک (SMS Alert)',
        };
        setSaveSuccessMsg(
          `تله‌متری بلادرنگ درگاه ${nameMap[gatewayId]} ${!currentVal ? 'فعال' : 'غیرفعال'} گردید.`
        );
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle gateway telemetry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Change Pulse Refresh Interval
  const handleChangeInterval = async (seconds: number) => {
    if (isSaving || localPulseConfig.refreshIntervalSec === seconds) return;
    setIsSaving(true);
    const updatedConfig: GatewayPulseConfig = {
      ...localPulseConfig,
      refreshIntervalSec: seconds,
    };
    setLocalPulseConfig(updatedConfig);

    try {
      const res = await fetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config && onUpdatePulseConfig) {
        onUpdatePulseConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to change pulse interval:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger manual test pulse check ping
  const handleTriggerTestPulse = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setSaveSuccessMsg(null);

    try {
      if (onTriggerPulsePing) {
        await onTriggerPulsePing();
      } else {
        await fetch('/api/gateways/pulse-ping', { method: 'POST' });
      }
      setSaveSuccessMsg('پالس آزمایشی با موفقیت ارسال شد؛ تاخیر و تله‌متری تمامی درگاه‌ها به‌روز گردید.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Test pulse check failed:', err);
    } finally {
      setIsPinging(false);
    }
  };

  // Toggle Privacy Policy (audited vs ephemeral)
  const handleTogglePolicy = async (newPolicy: DataRetentionPolicy) => {
    if (isSaving || newPolicy === privacySettings.retentionPolicy) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch('/api/system/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionPolicy: newPolicy,
          scrubSensitiveMedicalNotes: privacySettings.scrubSensitiveMedicalNotes,
        }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        onUpdatePrivacySettings(data.settings);
        setSaveSuccessMsg(data.message);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to update privacy retention policy:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Clinical Note Scrubbing
  const handleToggleScrubbing = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newScrubValue = !privacySettings.scrubSensitiveMedicalNotes;

    try {
      const res = await fetch('/api/system/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionPolicy: privacySettings.retentionPolicy,
          scrubSensitiveMedicalNotes: newScrubValue,
        }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        onUpdatePrivacySettings(data.settings);
        setSaveSuccessMsg('تنظیمات پالایش داده‌های پزشکی با موفقیت بروزرسانی شد.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update scrub settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getGatewayChannelData = (id: ChannelPlatform) => {
    return channels.find((c) => c.id === id);
  };

  const enabledGatewaysCount = Object.values(localPulseConfig.gateways).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0d1017]/95 border border-white/[0.12] shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-zinc-100 overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shadow-inner">
              <Sliders className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                تنظیمات سیستمی و خط لوله (System Configuration)
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Embednet OS v4.1 • Gateway Pulse Telemetry & Retention Policies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">

          {/* Feedback Message */}
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 space-x-reverse animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 1: PULSE CHECK & GATEWAY CONNECTION TELEMETRY */}
          {/* =============================================================== */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 shadow-inner">
            
            {/* Top Bar: Icon, Title, and Master Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  localPulseConfig.enabled
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/[0.05] border-white/[0.1] text-zinc-400'
                }`}>
                  <HeartPulse className={`w-5 h-5 ${localPulseConfig.enabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white tracking-wide">
                      پایش پالس بلادرنگ درگاه‌ها (Pulse Check & Gateway Telemetry)
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      localPulseConfig.enabled
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/[0.06] border-white/[0.1] text-zinc-400'
                    }`}>
                      {localPulseConfig.enabled
                        ? `PULSE ACTIVE (${enabledGatewaysCount}/4 GATEWAYS)`
                        : 'TELEMETRY DISABLED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    سنجش بلادرنگ پینگ، نوسان تاخیر (Jitter)، افت بسته، سلامت سوکت و زمان تایید وب‌هوک برای هر درگاه
                  </p>
                </div>
              </div>

              {/* Master Pulse Check Toggle Switch */}
              <div className="flex items-center space-x-3 space-x-reverse self-end sm:self-auto">
                <span className="text-[11px] text-zinc-300 font-mono">
                  {localPulseConfig.enabled ? 'پالس‌چک فعال' : 'پالس‌چک خاموش'}
                </span>
                <button
                  onClick={handleTogglePulseMaster}
                  disabled={isSaving}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer border ${
                    localPulseConfig.enabled
                      ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/[0.1] border-white/[0.12]'
                  }`}
                  title="کلید فعال/غیرفعال‌سازی کلی پایش پالس (Pulse Check Toggle)"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      localPulseConfig.enabled ? 'translate-x-1' : 'translate-x-7'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* If Pulse Check is Enabled: Show Controls & Per-Gateway Telemetry Toggles */}
            {localPulseConfig.enabled ? (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                
                {/* Control Ribbon: Frequency + Test Pulse Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                  <div className="flex items-center space-x-2 space-x-reverse text-zinc-300">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-zinc-400">فرکانس تله‌متری:</span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {[
                        { sec: 2, label: '۲ ثانیه (بلادرنگ)' },
                        { sec: 5, label: '۵ ثانیه (استاندارد)' },
                        { sec: 15, label: '۱۵ ثانیه (اکو)' },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          onClick={() => handleChangeInterval(item.sec)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                            localPulseConfig.refreshIntervalSec === item.sec
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerTestPulse}
                    disabled={isPinging || isSaving}
                    className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] transition-all cursor-pointer font-medium"
                    title="ارسال پالس آزمایشی به کلیه درگاه‌ها"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'در حال سنجش پالس...' : 'ارسال پالس آزمایشی (Ping)'}</span>
                  </button>
                </div>

                {/* Subheading for Per-Gateway Toggles */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-sky-400" />
                    <span>تله‌متری تفکیکی برای هر درگاه (Gateway Telemetry Controls)</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    فعال‌سازی مجزای متریک‌های بلادرنگ جهت کاهش سربار و بهینه‌سازی منابع
                  </span>
                </div>

                {/* Per-Gateway Grid: WhatsApp, Bale, Telegram, SMS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* 1. WhatsApp Multi-Device Gateway */}
                  {(() => {
                    const ch = getGatewayChannelData('whatsapp');
                    const isGwEnabled = localPulseConfig.gateways.whatsapp;
                    const tel = ch?.telemetry;
                    const health = getLatencyHealth(ch?.latencyMs || 24, tel?.jitterMs);
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isGwEnabled
                          ? 'bg-emerald-500/[0.04] border-emerald-500/20 shadow-[0_2px_12px_rgba(16,185,129,0.08)]'
                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${health.containerBgClass} ${health.containerBorderClass}`}>
                              <PhoneCall className={`w-3.5 h-3.5 ${health.iconColorClass}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white">واتساپ (WhatsApp Gateway)</span>
                                {health.isAlert && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass}`}>
                                    {health.persianLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">Evolution API v2 • Webhook Ingest</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleGatewayTelemetry('whatsapp')}
                            disabled={isSaving}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border ${
                              isGwEnabled
                                ? 'bg-emerald-500 border-emerald-400'
                                : 'bg-white/[0.1] border-white/[0.1]'
                            }`}
                            title="فعال/غیرفعال تله‌متری واتساپ"
                          >
                            <span
                              className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                                isGwEnabled ? 'translate-x-0.5' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>

                        {isGwEnabled ? (
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">تاخیر پینگ:</span>
                              <span className={`font-bold ${health.iconColorClass}`}>{ch?.latencyMs || 24}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">نوسان (Jitter):</span>
                              <span className="text-zinc-200">±{tel?.jitterMs ?? 2.1}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">تایید وب‌هوک:</span>
                              <span className="text-sky-300">{tel?.webhookAckRatePct ?? 99.8}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-400 pt-1">
                            تله‌متری تفصیلی غیرفعال است (بدون پایش دوره‌ای).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. Bale Messenger Bot Hook */}
                  {(() => {
                    const ch = getGatewayChannelData('bale');
                    const isGwEnabled = localPulseConfig.gateways.bale;
                    const tel = ch?.telemetry;
                    const health = getLatencyHealth(ch?.latencyMs || 38, tel?.jitterMs);
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isGwEnabled
                          ? 'bg-sky-500/[0.04] border-sky-500/20 shadow-[0_2px_12px_rgba(14,165,233,0.08)]'
                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${health.containerBgClass} ${health.containerBorderClass}`}>
                              <Radio className={`w-3.5 h-3.5 ${health.iconColorClass}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white">بله (Bale Messenger Hook)</span>
                                {health.isAlert && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass}`}>
                                    {health.persianLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">bale-med Pipeline • Iran Relay</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleGatewayTelemetry('bale')}
                            disabled={isSaving}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border ${
                              isGwEnabled
                                ? 'bg-sky-500 border-sky-400'
                                : 'bg-white/[0.1] border-white/[0.1]'
                            }`}
                            title="فعال/غیرفعال تله‌متری بله"
                          >
                            <span
                              className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                                isGwEnabled ? 'translate-x-0.5' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>

                        {isGwEnabled ? (
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">تاخیر پینگ:</span>
                              <span className={`font-bold ${health.iconColorClass}`}>{ch?.latencyMs || 38}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">نوسان (Jitter):</span>
                              <span className="text-zinc-200">±{tel?.jitterMs ?? 4.3}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">افت بسته:</span>
                              <span className="text-emerald-300">{tel?.packetLossPct ?? 0.1}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-400 pt-1">
                            تله‌متری تفصیلی غیرفعال است (بدون پایش دوره‌ای).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. Telegram Bot API */}
                  {(() => {
                    const ch = getGatewayChannelData('telegram');
                    const isGwEnabled = localPulseConfig.gateways.telegram;
                    const tel = ch?.telemetry;
                    const health = getLatencyHealth(ch?.latencyMs || 52, tel?.jitterMs);
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isGwEnabled
                          ? 'bg-blue-500/[0.04] border-blue-500/20 shadow-[0_2px_12px_rgba(59,130,246,0.08)]'
                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${health.containerBgClass} ${health.containerBorderClass}`}>
                              <Send className={`w-3.5 h-3.5 ${health.iconColorClass}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white">تلگرام (Telegram Bot API)</span>
                                {health.isAlert && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass}`}>
                                    {health.persianLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">Direct TLS 1.3 Webhook</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleGatewayTelemetry('telegram')}
                            disabled={isSaving}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border ${
                              isGwEnabled
                                ? 'bg-blue-500 border-blue-400'
                                : 'bg-white/[0.1] border-white/[0.1]'
                            }`}
                            title="فعال/غیرفعال تله‌متری تلگرام"
                          >
                            <span
                              className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                                isGwEnabled ? 'translate-x-0.5' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>

                        {isGwEnabled ? (
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">تاخیر پینگ:</span>
                              <span className={`font-bold ${health.iconColorClass}`}>{ch?.latencyMs || 52}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">نوسان (Jitter):</span>
                              <span className="text-zinc-200">±{tel?.jitterMs ?? 6.0}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">موفقیت وب‌هوک:</span>
                              <span className="text-emerald-300">{tel?.webhookAckRatePct ?? 100}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-400 pt-1">
                            تله‌متری تفصیلی غیرفعال است (بدون پایش دوره‌ای).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. Iran SMS Fast-Alert Gateway */}
                  {(() => {
                    const ch = getGatewayChannelData('sms');
                    const isGwEnabled = localPulseConfig.gateways.sms;
                    const tel = ch?.telemetry;
                    const health = getLatencyHealth(ch?.latencyMs || 110, tel?.jitterMs);
                    return (
                      <div className={`p-3.5 rounded-2xl border transition-all ${
                        isGwEnabled
                          ? 'bg-amber-500/[0.04] border-amber-500/20 shadow-[0_2px_12px_rgba(245,158,11,0.08)]'
                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors ${health.containerBgClass} ${health.containerBorderClass}`}>
                              <MessageSquare className={`w-3.5 h-3.5 ${health.iconColorClass}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white">سامانه پیامک (SMS Alert Gate)</span>
                                {health.isAlert && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${health.badgeClass}`}>
                                    {health.persianLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">Faraz / Kavenegar REST Pool</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleGatewayTelemetry('sms')}
                            disabled={isSaving}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border ${
                              isGwEnabled
                                ? 'bg-amber-500 border-amber-400'
                                : 'bg-white/[0.1] border-white/[0.1]'
                            }`}
                            title="فعال/غیرفعال تله‌متری پیامک"
                          >
                            <span
                              className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                                isGwEnabled ? 'translate-x-0.5' : 'translate-x-5'
                              }`}
                            />
                          </button>
                        </div>

                        {isGwEnabled ? (
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">تاخیر پینگ:</span>
                              <span className={`font-bold ${health.iconColorClass}`}>{ch?.latencyMs || 110}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">نوسان (Jitter):</span>
                              <span className="text-zinc-200">±{tel?.jitterMs ?? 12.4}ms</span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-black/20 border border-white/[0.04]">
                              <span className="text-zinc-400 block text-[9px]">سلامت هندشیک:</span>
                              <span className="text-emerald-300">{tel?.webhookAckRatePct ?? 98.9}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-400 pt-1">
                            تله‌متری تفصیلی غیرفعال است (بدون پایش دوره‌ای).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                <span>
                  پایش پالس خاموش است. با فعال‌سازی کلید بالا، وضعیت اتصال، پینگ و جیتر درگاه‌ها بلادرنگ مانیتور می‌شوند.
                </span>
                <button
                  onClick={handleTogglePulseMaster}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 transition-colors cursor-pointer text-[11px] font-medium"
                >
                  روشن کردن پالس‌چک
                </button>
              </div>
            )}

            {/* Link to Gateway History and Audit Ledger */}
            {onNavigateToTab && (
              <div className="pt-2 flex items-center justify-between border-t border-white/[0.05]">
                <span className="text-[11px] text-zinc-400 font-mono">
                  آرشیو وقایع: مشاهده دفتر تغییرات و لاگ پالس‌های پیشین
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToTab('history');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>مشاهده دفتر تاریخچه و حسابرسی ←</span>
                </button>
              </div>
            )}

          </div>

          {/* =============================================================== */}
          {/* SECTION 2: GLOBAL DATA PRIVACY & RETENTION POLICY */}
          {/* =============================================================== */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  privacySettings.retentionPolicy === 'ephemeral'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                }`}>
                  {privacySettings.retentionPolicy === 'ephemeral' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>حریم خصوصی و ماندگاری داده‌ها (Data Privacy & Retention)</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      privacySettings.retentionPolicy === 'ephemeral'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    }`}>
                      {privacySettings.retentionPolicy === 'ephemeral' ? 'EPHEMERAL ZERO-RETENTION' : 'WORKLEDGER AUDIT LOGGED'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    تعیین رفتار خط لوله در ذخیره متادیتا و لاگ‌های تعامل برای ربات‌های با حساسیت و محرمانگی بالا
                  </p>
                </div>
              </div>

              {isSaving && (
                <div className="flex items-center space-x-1.5 space-x-reverse text-xs text-zinc-400 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                  <span>همگام‌سازی...</span>
                </div>
              )}
            </div>

            {/* Segmented Dual Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              {/* Option A: Audited / WorkLedger Logged */}
              <div
                onClick={() => handleTogglePolicy('audited')}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  privacySettings.retentionPolicy === 'audited'
                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Database className={`w-4 h-4 ${privacySettings.retentionPolicy === 'audited' ? 'text-indigo-300' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold text-white">ثبت در دفتر کار (WorkLedger Logged)</span>
                    </div>
                    {privacySettings.retentionPolicy === 'audited' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    متادیتای سشن‌ها، خلاصه استعلام، شناسه فرستنده و بار محاسباتی توکن‌ها مستقیماً در کارتابل و دفتر کار ثبت می‌شوند تا امکان بازبینی و مانیتورینگ ادواری فراهم باشد.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>سشن‌های لاگ‌شده:</span>
                  <span className="text-indigo-300 font-bold">{privacySettings.loggedSessionsCount} مورد</span>
                </div>
              </div>

              {/* Option B: Ephemeral / High-Privacy Medical & Professional */}
              <div
                onClick={() => handleTogglePolicy('ephemeral')}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  privacySettings.retentionPolicy === 'ephemeral'
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ShieldCheck className={`w-4 h-4 ${privacySettings.retentionPolicy === 'ephemeral' ? 'text-emerald-300' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold text-white">سشن‌های موقت محرمانه (Medical Ephemeral)</span>
                    </div>
                    {privacySettings.retentionPolicy === 'ephemeral' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    ویژه ربات‌های پزشکی، تریاژ و مشاوره‌های حرفه‌ای؛ مکالمات کاملاً فرار (In-Memory RAM) بوده و هیچ متادیتا، نام بیمار یا استعلام در دفتر کار ذخیره نخواهد شد.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>سشن‌های با Zero-Retention:</span>
                  <span className="text-emerald-300 font-bold">{privacySettings.ephemeralSessionsCount} مورد</span>
                </div>
              </div>

            </div>

            {/* Secondary High-Privacy Settings */}
            <div className="pt-2 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <EyeOff className="w-4 h-4 text-zinc-400" />
                  <div>
                    <span className="text-xs text-zinc-200 block">پالایش متن استعلام‌های بالینی (Clinical Note Scrubbing)</span>
                    <span className="text-[10px] text-zinc-400">ماسک‌کردن خودکار متون و شرح‌حال‌های پزشکی در کنسول ردیابی و صف بازبینی</span>
                  </div>
                </div>

                <button
                  onClick={handleToggleScrubbing}
                  disabled={isSaving}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border ${
                    privacySettings.scrubSensitiveMedicalNotes
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-white/[0.1] border-white/[0.1]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      privacySettings.scrubSensitiveMedicalNotes ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>

              {/* Bot Domain Scope Tags */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                <span>دامنه‌های تحت پوشش حریم خصوصی بالا:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                    Medical Triage
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                    Clinical Rx
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                    Professional Legal
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Operational Guidance Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse text-zinc-300 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>اثرگذاری بر رفتار هسته لانگ‌بات و خط لوله پیام‌ها:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed pr-6">
              با فعال‌سازی <strong>Pulse Check</strong>، تله‌متری اتصال و سلامت پروتکل‌های شبکه به‌صورت مداوم رصد می‌شود تا قطعی‌ها قبل از اثرگذاری بر مکالمه کاربر نهایی آشکار گردند. همچنین با فعال‌سازی حالت <strong>سشن‌های موقت محرمانه (Ephemeral)</strong>، اطلاعات پزشکی و بالینی برای تطابق با استانداردهای HIPAA از ثبت در دفتر کار مستثنی می‌شوند.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-zinc-400 font-mono">
            <span className={`w-2 h-2 rounded-full ${localPulseConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span>پالس درگاه‌ها: {localPulseConfig.enabled ? `${enabledGatewaysCount} فعال` : 'غیرفعال'}</span>
            <span>•</span>
            <span>آخرین تغییر: {privacySettings.lastToggledAt}</span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('ledger');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs text-zinc-300 transition-colors cursor-pointer border border-white/[0.08]"
              >
                مشاهده کارتابل دفتر کار
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm"
            >
              تایید و بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
