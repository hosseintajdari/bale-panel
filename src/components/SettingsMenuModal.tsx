import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  EyeOff,
  CheckCircle2,
  HeartPulse,
  Sliders,
  PhoneCall,
  Radio,
  Send,
  MessageSquare,
  Zap,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  GlobalPrivacySettings,
  DataRetentionPolicy,
  GatewayPulseConfig,
  ChannelGatewayStatus,
  ChannelPlatform,
} from '../types';
import { getLatencyHealth } from '../utils/healthAlerts';
import { authFetch } from '../utils/api';

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
  onUpdateChannels?: (channels: ChannelGatewayStatus[]) => void;
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
  lastCheckedAt: 'Now',
};

const GATEWAY_META: {
  id: ChannelPlatform;
  title: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}[] = [
  { id: 'whatsapp', title: 'WhatsApp Gateway', sub: 'Evolution API v2', icon: PhoneCall, color: 'text-emerald-400' },
  { id: 'bale', title: 'Bale Messenger', sub: 'Webhook Pipeline (bale-med)', icon: Radio, color: 'text-sky-400' },
  { id: 'telegram', title: 'Telegram Bot API', sub: 'Direct Bot API', icon: Send, color: 'text-blue-400' },
  { id: 'sms', title: 'SMS Fast-Alert', sub: 'REST Provider Pool', icon: MessageSquare, color: 'text-amber-400' },
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
  onUpdateChannels,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!isOpen) return null;

  // Toggle Master Pulse Check switch
  const handleTogglePulseMaster = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const newEnabled = !localPulseConfig.enabled;
    const updatedConfig: GatewayPulseConfig = {
      ...localPulseConfig,
      enabled: newEnabled,
      lastCheckedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLocalPulseConfig(updatedConfig);

    try {
      const res = await authFetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config) {
        if (onUpdatePulseConfig) onUpdatePulseConfig(data.config);
        if (data.channels && onUpdateChannels) onUpdateChannels(data.channels);
        showFeedback(newEnabled ? 'Pulse telemetry monitoring activated' : 'Pulse telemetry monitoring disabled');
      }
    } catch (err) {
      console.error('Failed to toggle pulse master:', err);
      showFeedback('Failed to update pulse settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Pulse Telemetry for a specific individual gateway
  const handleToggleGatewayTelemetry = async (gatewayId: ChannelPlatform) => {
    if (isSaving) return;
    setIsSaving(true);

    const currentVal = localPulseConfig.gateways[gatewayId] ?? true;
    const updatedGateways = {
      ...localPulseConfig.gateways,
      [gatewayId]: !currentVal,
    };
    const updatedConfig: GatewayPulseConfig = {
      ...localPulseConfig,
      gateways: updatedGateways,
      lastCheckedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLocalPulseConfig(updatedConfig);

    try {
      const res = await authFetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config) {
        if (onUpdatePulseConfig) onUpdatePulseConfig(data.config);
        if (data.channels && onUpdateChannels) onUpdateChannels(data.channels);
      }
    } catch (err) {
      console.error('Failed to toggle gateway telemetry:', err);
      showFeedback('Failed to toggle gateway', 'error');
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
      const res = await authFetch('/api/system/pulse-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success && data.config && onUpdatePulseConfig) {
        onUpdatePulseConfig(data.config);
        if (data.channels && onUpdateChannels) onUpdateChannels(data.channels);
      }
    } catch (err) {
      console.error('Failed to change pulse interval:', err);
      showFeedback('Failed to update refresh interval', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger manual test pulse check ping
  const handleTriggerTestPulse = async () => {
    if (isPinging) return;
    setIsPinging(true);

    try {
      if (onTriggerPulsePing) {
        await onTriggerPulsePing();
      } else {
        const res = await authFetch('/api/gateways/pulse-ping', { method: 'POST' });
        const data = await res.json();
        if (data.channels && onUpdateChannels) {
          onUpdateChannels(data.channels);
        }
      }
      showFeedback('Live telemetry ping executed successfully');
    } catch (err) {
      console.error('Test pulse check failed:', err);
      showFeedback('Pulse ping request failed', 'error');
    } finally {
      setIsPinging(false);
    }
  };

  // Toggle Privacy Policy
  const handleTogglePolicy = async (newPolicy: DataRetentionPolicy) => {
    if (isSaving || newPolicy === privacySettings.retentionPolicy) return;
    setIsSaving(true);

    try {
      const res = await authFetch('/api/system/privacy-settings', {
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
        showFeedback(
          newPolicy === 'ephemeral'
            ? 'Ephemeral Zero-Retention policy activated'
            : 'WorkLedger Audited logging policy activated'
        );
      }
    } catch (err) {
      console.error('Failed to update privacy retention policy:', err);
      showFeedback('Failed to update retention policy', 'error');
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
      const res = await authFetch('/api/system/privacy-settings', {
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
        showFeedback(
          newScrubValue
            ? 'Clinical note scrubbing enabled (HIPAA/GDPR)'
            : 'Clinical note scrubbing disabled'
        );
      }
    } catch (err) {
      console.error('Failed to update scrub settings:', err);
      showFeedback('Failed to update scrubbing policy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getGatewayChannelData = (id: ChannelPlatform) => {
    return channels.find((c) => c.id === id);
  };

  const enabledGatewaysCount = Object.values(localPulseConfig.gateways).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" dir="ltr">
      {/* Dim Matte Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog — Strict 2026 Linear / Raycast Style */}
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0A0C10] border border-[#1C202B] shadow-2xl text-zinc-100 overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="h-11 px-4 border-b border-[#1C202B] bg-[#0E121A] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold text-white tracking-tight font-sans">
              System Configuration
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
              v4.1 Core
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.06] hidden sm:inline">
              ESC to close
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 1: PULSE CHECK & GATEWAY CONNECTION TELEMETRY */}
          {/* =============================================================== */}
          <div className="p-3.5 rounded-xl bg-[#0E121A] border border-[#1C202B] space-y-3">
            {/* Header: Master Switch & Interval Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1C202B]">
              <div className="flex items-center gap-2">
                <HeartPulse
                  className={`w-4 h-4 ${
                    localPulseConfig.enabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Gateway Pulse & Telemetry</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({enabledGatewaysCount}/4 active)
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Live channel heartbeat, jitter telemetry, and webhook ACK tracking
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Interval Pills */}
                {localPulseConfig.enabled && (
                  <div className="flex items-center bg-black/40 p-0.5 rounded-md border border-white/[0.06] text-[10px] font-mono">
                    {[2, 3, 5, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleChangeInterval(sec)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          localPulseConfig.refreshIntervalSec === sec
                            ? 'bg-white/[0.14] text-white font-semibold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={`Pulse every ${sec} seconds`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual Ping Trigger */}
                <button
                  onClick={handleTriggerTestPulse}
                  disabled={isPinging || !localPulseConfig.enabled}
                  className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Run immediate ping test on all active gateways"
                >
                  <Zap className={`w-3 h-3 ${isPinging ? 'animate-spin text-amber-400' : 'text-zinc-400'}`} />
                  <span>Ping</span>
                </button>

                {/* Master Switch */}
                <button
                  role="switch"
                  aria-checked={localPulseConfig.enabled}
                  aria-label="Toggle Pulse Telemetry Monitoring"
                  onClick={handleTogglePulseMaster}
                  disabled={isSaving}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer border shrink-0 ${
                    localPulseConfig.enabled
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      localPulseConfig.enabled ? 'translate-x-4' : 'translate-x-0.5'
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
                  const isGwEnabled = localPulseConfig.gateways[meta.id] ?? true;
                  const tel = ch?.telemetry;
                  const latency = ch?.latencyMs || 30;
                  const health = getLatencyHealth(latency, tel?.jitterMs);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={meta.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isGwEnabled
                          ? 'bg-black/30 border-[#1C202B]'
                          : 'bg-black/10 border-white/[0.03] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                          <div>
                            <div className="text-[11px] font-semibold text-zinc-200 leading-none">
                              {meta.title}
                            </div>
                            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
                              {meta.sub}
                            </div>
                          </div>
                        </div>

                        <button
                          role="switch"
                          aria-checked={isGwEnabled}
                          aria-label={`Toggle ${meta.title} telemetry`}
                          onClick={() => handleToggleGatewayTelemetry(meta.id)}
                          disabled={isSaving}
                          className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer border shrink-0 ${
                            isGwEnabled
                              ? 'bg-sky-500 border-sky-400'
                              : 'bg-zinc-800 border-zinc-700'
                          }`}
                        >
                          <span
                            className={`block w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                              isGwEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      {isGwEnabled && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-white/[0.04]">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">Ping:</span>
                            <span className={`font-semibold ${health.iconColorClass}`}>
                              {latency}ms
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">Jitter:</span>
                            <span>±{tel?.jitterMs ?? 4}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">ACK:</span>
                            <span className="text-emerald-300 font-semibold">
                              {tel?.webhookAckRatePct ?? 100}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-zinc-500 text-xs font-mono bg-black/20 rounded-lg border border-dashed border-white/[0.06]">
                Pulse telemetry is inactive. Toggle master switch above to monitor live channel latency and ACK rates.
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 2: GLOBAL DATA PRIVACY & RETENTION POLICY */}
          {/* =============================================================== */}
          <div className="p-3.5 rounded-xl bg-[#0E121A] border border-[#1C202B] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Data Retention & Privacy Policy</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Controls compliance boundary between persistent SQLite audit and volatile RAM
                </p>
              </div>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                  privacySettings.retentionPolicy === 'ephemeral'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                }`}
              >
                {privacySettings.retentionPolicy === 'ephemeral'
                  ? 'Ephemeral Zero-Retention'
                  : 'WorkLedger Audited'}
              </span>
            </div>

            {/* Segmented Dual Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option A: Audited */}
              <div
                onClick={() => handleTogglePolicy('audited')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  privacySettings.retentionPolicy === 'audited'
                    ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-black/30 border-[#1C202B] hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-semibold text-white">
                      WorkLedger Audited
                    </span>
                  </div>
                  {privacySettings.retentionPolicy === 'audited' && (
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <div dir="rtl" className="text-[10px] text-zinc-400 font-sans leading-relaxed mt-1">
                  ثبت دائمی متادیتا و بار محاسباتی توکن‌ها در دیتابیس پایدار SQLite ({privacySettings.loggedSessionsCount} نشست ثبت‌شده).
                </div>
              </div>

              {/* Option B: Ephemeral */}
              <div
                onClick={() => handleTogglePolicy('ephemeral')}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  privacySettings.retentionPolicy === 'ephemeral'
                    ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-black/30 border-[#1C202B] hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-white">
                      Ephemeral Zero-Retention
                    </span>
                  </div>
                  {privacySettings.retentionPolicy === 'ephemeral' && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div dir="rtl" className="text-[10px] text-zinc-400 font-sans leading-relaxed mt-1">
                  ویژه ربات‌های پزشکی و مشاوره‌ای؛ داده‌ها در RAM اجرا شده و ذخیره نمی‌شوند ({privacySettings.ephemeralSessionsCount} نشست محافظت‌شده).
                </div>
              </div>
            </div>

            {/* Clinical Note Scrubbing Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-[#1C202B] text-xs">
              <div className="flex items-center gap-2.5">
                <EyeOff className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium text-zinc-200">
                    Clinical Note Scrubbing (HIPAA / GDPR)
                  </div>
                  <div dir="rtl" className="text-[10px] text-zinc-500 font-sans mt-0.5">
                    پالایش و ماسک خودکار مشخصات شناسنامه‌ای و پرونده‌های حساس بالینی
                  </div>
                </div>
              </div>

              <button
                role="switch"
                aria-checked={privacySettings.scrubSensitiveMedicalNotes}
                aria-label="Toggle Clinical Note Scrubbing"
                onClick={handleToggleScrubbing}
                disabled={isSaving}
                className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer border shrink-0 ${
                  privacySettings.scrubSensitiveMedicalNotes
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <span
                  className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                    privacySettings.scrubSensitiveMedicalNotes ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div className="h-11 px-4 border-t border-[#1C202B] bg-[#0E121A] flex items-center justify-between shrink-0 select-none">
          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Synced: {privacySettings.lastToggledAt || 'Just now'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('ledger');
                }}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                WorkLedger
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-white text-black text-[11px] font-semibold hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
