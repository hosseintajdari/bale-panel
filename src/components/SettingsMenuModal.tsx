import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  EyeOff,
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

const GATEWAY_META: {
  id: ChannelPlatform;
  title: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}[] = [
  { id: 'whatsapp', title: 'واتساپ (WhatsApp)', sub: 'Evolution API v2', icon: PhoneCall, color: 'text-emerald-400' },
  { id: 'bale', title: 'بله (Bale Messenger)', sub: 'Webhook Pipeline', icon: Radio, color: 'text-sky-400' },
  { id: 'telegram', title: 'تلگرام (Telegram)', sub: 'Direct Bot API', icon: Send, color: 'text-blue-400' },
  { id: 'sms', title: 'پیامک (SMS Alert)', sub: 'Fast-Alert REST Pool', icon: MessageSquare, color: 'text-amber-400' },
];

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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
          newEnabled ? 'پایش پالس درگاه‌ها فعال شد.' : 'پایش پالس غیرفعال شد.'
        );
        setTimeout(() => setSaveSuccessMsg(null), 2500);
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
      setSaveSuccessMsg('پالس تلمتری درگاه‌ها به‌روز شد.');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (err) {
      console.error('Test pulse check failed:', err);
    } finally {
      setIsPinging(false);
    }
  };

  // Toggle Privacy Policy
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
        setTimeout(() => setSaveSuccessMsg(null), 3000);
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
        setSaveSuccessMsg('تنظیمات پالایش متن بالینی به‌روزرسانی شد.');
        setTimeout(() => setSaveSuccessMsg(null), 2500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090C13] border border-[#1E2538] shadow-2xl text-zinc-100 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <div>
              <h2 className="text-xs font-semibold text-white tracking-tight">
                تنظیمات سیستم و درگاه‌ها (System Configuration)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="بستن (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 max-h-[78vh] overflow-y-auto">
          {/* Feedback Message */}
          {saveSuccessMsg && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 1: PULSE CHECK & GATEWAY CONNECTION TELEMETRY */}
          {/* =============================================================== */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            {/* Master Switch & Interval */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <HeartPulse className={`w-4 h-4 ${localPulseConfig.enabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                <span className="text-xs font-semibold text-white">پایش پالس درگاه‌ها (Pulse Check)</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  ({enabledGatewaysCount}/۴ فعال)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Interval Pills */}
                {localPulseConfig.enabled && (
                  <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-[10px] font-mono">
                    {[2, 3, 5, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleChangeInterval(sec)}
                        className={`px-1.5 py-0.2 rounded cursor-pointer transition-colors ${
                          localPulseConfig.refreshIntervalSec === sec
                            ? 'bg-white/[0.15] text-white font-bold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}

                {/* Ping Button */}
                <button
                  onClick={handleTriggerTestPulse}
                  disabled={isPinging || !localPulseConfig.enabled}
                  className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[10px] font-mono text-zinc-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="تست پینگ دستی"
                >
                  <Zap className={`w-3 h-3 ${isPinging ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
                  <span>پینگ تست</span>
                </button>

                {/* Master Switch */}
                <button
                  onClick={handleTogglePulseMaster}
                  disabled={isSaving}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer border ${
                    localPulseConfig.enabled
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-white/[0.1] border-white/[0.1]'
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      localPulseConfig.enabled ? 'translate-x-0.5' : 'translate-x-4'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Compact 2x2 Gateway Telemetry Grid */}
            {localPulseConfig.enabled ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GATEWAY_META.map((meta) => {
                  const ch = getGatewayChannelData(meta.id);
                  const isGwEnabled = localPulseConfig.gateways[meta.id];
                  const tel = ch?.telemetry;
                  const health = getLatencyHealth(ch?.latencyMs || 40, tel?.jitterMs);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={meta.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isGwEnabled
                          ? 'bg-black/30 border-white/[0.08]'
                          : 'bg-white/[0.01] border-white/[0.04] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          <span className="text-[11px] font-semibold text-zinc-200">{meta.title}</span>
                        </div>

                        <button
                          onClick={() => handleToggleGatewayTelemetry(meta.id)}
                          disabled={isSaving}
                          className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer border ${
                            isGwEnabled
                              ? 'bg-sky-500 border-sky-400'
                              : 'bg-white/[0.1] border-white/[0.1]'
                          }`}
                        >
                          <span
                            className={`block w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                              isGwEnabled ? 'translate-x-0.5' : 'translate-x-3.5'
                            }`}
                          />
                        </button>
                      </div>

                      {isGwEnabled && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                          <span>پینگ: <strong className={health.iconColorClass}>{ch?.latencyMs || 30}ms</strong></span>
                          <span>جیتر: ±{tel?.jitterMs ?? 6}ms</span>
                          <span className="text-emerald-300">موفقیت: {tel?.webhookAckRatePct ?? 100}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-zinc-500 text-xs font-mono">
                پایش پالس خاموش است. با فعال‌سازی کلید بالا، وضعیت اتصال و تاخیر درگاه‌ها رصد می‌شود.
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 2: GLOBAL DATA PRIVACY & RETENTION POLICY */}
          {/* =============================================================== */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">حریم خصوصی و ماندگاری داده‌ها (Data Retention)</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                privacySettings.retentionPolicy === 'ephemeral'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
              }`}>
                {privacySettings.retentionPolicy === 'ephemeral' ? 'EPHEMERAL ZERO-RETENTION' : 'WORKLEDGER AUDIT LOGGED'}
              </span>
            </div>

            {/* Segmented Dual Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option A: Audited */}
              <div
                onClick={() => handleTogglePolicy('audited')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  privacySettings.retentionPolicy === 'audited'
                    ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-semibold text-white">ثبت در دفتر کار (Audited)</span>
                  </div>
                  {privacySettings.retentionPolicy === 'audited' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  متادیتا و بار محاسباتی توکن‌ها در دیتابیس ثبت می‌شوند ({privacySettings.loggedSessionsCount} سشن).
                </p>
              </div>

              {/* Option B: Ephemeral */}
              <div
                onClick={() => handleTogglePolicy('ephemeral')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  privacySettings.retentionPolicy === 'ephemeral'
                    ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-white">سشن موقت فرار (Ephemeral)</span>
                  </div>
                  {privacySettings.retentionPolicy === 'ephemeral' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ویژه ربات‌های پزشکی و مشاوره‌ای؛ داده‌ها در RAM اجرا شده و ذخیره نمی‌شوند ({privacySettings.ephemeralSessionsCount} سشن).
                </p>
              </div>
            </div>

            {/* Clinical Note Scrubbing Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.05] mt-1 text-xs">
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] text-zinc-200">پالایش متن بالینی (Clinical Note Scrubbing)</span>
              </div>

              <button
                onClick={handleToggleScrubbing}
                disabled={isSaving}
                className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer border ${
                  privacySettings.scrubSensitiveMedicalNotes
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-white/[0.1] border-white/[0.1]'
                }`}
              >
                <span
                  className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                    privacySettings.scrubSensitiveMedicalNotes ? 'translate-x-0.5' : 'translate-x-4'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.02] text-xs">
          <div className="text-[10px] font-mono text-zinc-400">
            تغییر: {privacySettings.lastToggledAt}
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('ledger');
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                دفتر کارکرد
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white text-black text-[11px] font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
