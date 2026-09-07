import React, { useState, useEffect } from 'react';
import { AppleGlassHeader } from './components/AppleGlassHeader';
import { ChannelsStatusGrid } from './components/ChannelsStatusGrid';
import { PipelineConsole } from './components/PipelineConsole';
import { ShadowReviewQueue } from './components/ShadowReviewQueue';
import { WorkLedgerPanel } from './components/WorkLedgerPanel';
import { McpAccountsGrid } from './components/McpAccountsGrid';
import { CodeGeneratorSection } from './components/CodeGeneratorSection';
import { EvolutionWhatsAppHub } from './components/EvolutionWhatsAppHub';
import { SettingsMenuModal } from './components/SettingsMenuModal';
import { GatewayHistoryTab } from './components/GatewayHistoryTab';
import { ChannelPlatform, ChannelGatewayStatus, ShadowReviewItem, PipelineTraceStep, GlobalPrivacySettings, GatewayPulseConfig } from './types';

const INITIAL_CHANNELS: ChannelGatewayStatus[] = [
  {
    id: 'whatsapp',
    displayName: 'WhatsApp Multi-Device Gateway',
    status: 'active',
    method: 'Evolution API v2 / Direct Webhook',
    latencyMs: 24,
    unprocessedQueue: 1,
    lastHeartbeat: 'اکنون',
  },
  {
    id: 'bale',
    displayName: 'Bale Messenger Bot Hook',
    status: 'active',
    method: 'Bale Webhook Pipeline (bale-med)',
    latencyMs: 38,
    unprocessedQueue: 1,
    lastHeartbeat: 'اکنون',
  },
  {
    id: 'telegram',
    displayName: 'Telegram Bot API',
    status: 'standby',
    method: 'Direct HTTPS Webhook',
    latencyMs: 52,
    unprocessedQueue: 0,
    lastHeartbeat: '۱ دقیقه پیش',
  },
  {
    id: 'sms',
    displayName: 'Iran SMS Fast-Alert Gateway',
    status: 'active',
    method: 'REST Provider Gate (Kavenegar/Faraz)',
    latencyMs: 110,
    unprocessedQueue: 0,
    lastHeartbeat: 'اکنون',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'whatsapp-hub' | 'shadow' | 'ledger' | 'integrations' | 'code-generator' | 'history'>('console');
  const [activeChannel, setActiveChannel] = useState<ChannelPlatform>('whatsapp');
  const [channels, setChannels] = useState<ChannelGatewayStatus[]>(INITIAL_CHANNELS);
  const [shadowQueue, setShadowQueue] = useState<ShadowReviewItem[]>([]);
  const [environmentMode, setEnvironmentMode] = useState<'shadow' | 'live'>('shadow');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<GlobalPrivacySettings>({
    retentionPolicy: 'audited',
    highPrivacyBotTypes: ['medical', 'clinical', 'professional', 'triage'],
    scrubSensitiveMedicalNotes: true,
    ephemeralSessionsCount: 52,
    loggedSessionsCount: 198,
    lastToggledAt: 'هم‌اکنون',
  });
  const [pulseConfig, setPulseConfig] = useState<GatewayPulseConfig>({
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
  });

  // Fetch initial state from server
  useEffect(() => {
    fetch('/api/pipeline/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.channels) setChannels(data.channels);
        if (data.shadowQueue) setShadowQueue(data.shadowQueue);
        if (data.privacySettings) setPrivacySettings(data.privacySettings);
        if (data.pulseConfig) setPulseConfig(data.pulseConfig);
      })
      .catch((err) => console.log('State fetch error:', err));
  }, []);

  // Periodic Telemetry Pulse Check when enabled
  useEffect(() => {
    if (!pulseConfig.enabled) return;

    const intervalMs = Math.max(2, pulseConfig.refreshIntervalSec || 3) * 1000;
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetch('/api/system/pulse-settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.channels) setChannels(data.channels);
          if (data.config) setPulseConfig(data.config);
        })
        .catch((err) => console.debug('Pulse check poll error:', err));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [pulseConfig.enabled, pulseConfig.refreshIntervalSec]);

  const handleTriggerPulsePing = async (mode?: 'simulate_spike') => {
    try {
      const res = await fetch('/api/gateways/pulse-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.channels) setChannels(data.channels);
        if (data.config) setPulseConfig(data.config);
      }
    } catch (err) {
      console.error('Pulse ping failed:', err);
    }
  };

  const handlePipelineProcessed = (record: ShadowReviewItem, trace: PipelineTraceStep[]) => {
    setShadowQueue((prev) => [record, ...prev]);
  };

  const handleShadowAction = async (id: string, action: 'approve' | 'reject' | 'modify', editedReply?: string) => {
    try {
      const res = await fetch('/api/pipeline/shadow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, editedReply }),
      });
      const data = await res.json();
      if (data.success) {
        setShadowQueue((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...data.item } : item))
        );
      }
    } catch (err) {
      console.error('Shadow action failed:', err);
    }
  };

  const pendingShadowCount = shadowQueue.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-hidden" dir="rtl">
      
      {/* Subtle Apple Ambient Glow Behind Glass */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Glass Header */}
      <AppleGlassHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shadowCount={pendingShadowCount}
        environmentMode={environmentMode}
        setEnvironmentMode={setEnvironmentMode}
        privacySettings={privacySettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 relative z-10">
        
        {/* Top Channel Gateway Status Cards (Always visible for executive situational awareness) */}
        <ChannelsStatusGrid
          channels={channels}
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          pulseConfig={pulseConfig}
          onTriggerPulsePing={handleTriggerPulsePing}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Tab Viewport */}
        {activeTab === 'console' && (
          <PipelineConsole
            activeChannel={activeChannel}
            environmentMode={environmentMode}
            onProcessed={handlePipelineProcessed}
            onOpenShadowReview={() => setActiveTab('shadow')}
            privacySettings={privacySettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'whatsapp-hub' && (
          <EvolutionWhatsAppHub
            onShadowUpdated={() => {
              fetch('/api/pipeline/state')
                .then((r) => r.json())
                .then((d) => { if (d.shadowQueue) setShadowQueue(d.shadowQueue); });
            }}
          />
        )}

        {activeTab === 'shadow' && (
          <ShadowReviewQueue
            queue={shadowQueue}
            onAction={handleShadowAction}
          />
        )}

        {activeTab === 'ledger' && (
          <WorkLedgerPanel
            privacySettings={privacySettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'integrations' && (
          <McpAccountsGrid />
        )}

        {activeTab === 'code-generator' && (
          <CodeGeneratorSection />
        )}

        {activeTab === 'history' && (
          <GatewayHistoryTab
            onRefreshChannels={() => {
              fetch('/api/pipeline/state')
                .then((r) => r.json())
                .then((d) => {
                  if (d.channels) setChannels(d.channels);
                  if (d.shadowQueue) setShadowQueue(d.shadowQueue);
                });
            }}
          />
        )}
      </main>

      {/* Global Settings & Privacy Policy Modal */}
      <SettingsMenuModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        privacySettings={privacySettings}
        onUpdatePrivacySettings={(newSettings) => setPrivacySettings(newSettings)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        pulseConfig={pulseConfig}
        onUpdatePulseConfig={(newConfig) => setPulseConfig(newConfig)}
        channels={channels}
        onTriggerPulsePing={handleTriggerPulsePing}
      />

      {/* Minimalist Glass Status Footer */}
      <footer className="w-full border-t border-white/[0.05] backdrop-blur-xl bg-black/30 py-3 text-[11px] text-zinc-400 font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Embednet OS Core</span>
            <span>•</span>
            <span className="text-zinc-400">لایه میان‌افزار پیام‌رسان‌ها (WhatsApp & Local Gateways)</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-zinc-400">حالت: {environmentMode === 'shadow' ? 'Shadow Pre-flight (امن)' : 'Live Outbox'}</span>
            <span>•</span>
            <span className="text-zinc-400">پروتکل MCP و الگوهای LangBot فعال</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
