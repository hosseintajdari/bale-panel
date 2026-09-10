import React, { useState, useEffect, useCallback } from 'react';
import { AppleGlassHeader } from './components/AppleGlassHeader';
import { SidebarNav, TabType } from './components/SidebarNav';
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
import { authFetch } from './utils/api';

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
  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [activeChannel, setActiveChannel] = useState<ChannelPlatform>('whatsapp');
  const [channels, setChannels] = useState<ChannelGatewayStatus[]>(INITIAL_CHANNELS);
  const [shadowQueue, setShadowQueue] = useState<ShadowReviewItem[]>([]);
  const [environmentMode, setEnvironmentMode] = useState<'shadow' | 'live'>('shadow');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    refreshIntervalSec: 4,
    alertOnJitterThresholdMs: 40,
    lastCheckedAt: 'هم‌اکنون',
  });

  // Fetch initial state from server
  useEffect(() => {
    authFetch('/api/pipeline/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.channels) setChannels(data.channels);
        if (data.shadowQueue) setShadowQueue(data.shadowQueue);
        if (data.privacySettings) setPrivacySettings(data.privacySettings);
        if (data.pulseConfig) setPulseConfig(data.pulseConfig);
      })
      .catch((err) => console.debug('State fetch error:', err));
  }, []);

  // Periodic Telemetry Pulse Check
  useEffect(() => {
    if (!pulseConfig.enabled) return;

    const intervalMs = Math.max(3, pulseConfig.refreshIntervalSec || 4) * 1000;
    const interval = setInterval(() => {
      if (document.hidden) return;
      authFetch('/api/system/pulse-settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.channels) setChannels(data.channels);
          if (data.config) setPulseConfig(data.config);
        })
        .catch((err) => console.debug('Pulse check poll error:', err));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [pulseConfig.enabled, pulseConfig.refreshIntervalSec]);

  const handleTriggerPulsePing = useCallback(async (mode?: 'simulate_spike') => {
    try {
      const res = await authFetch('/api/gateways/pulse-ping', {
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
  }, []);

  const handlePipelineProcessed = useCallback((record: ShadowReviewItem, trace: PipelineTraceStep[]) => {
    setShadowQueue((prev) => [record, ...prev]);
  }, []);

  const handleShadowAction = useCallback(async (id: string, action: 'approve' | 'reject' | 'modify', editedReply?: string) => {
    try {
      const res = await authFetch('/api/pipeline/shadow/action', {
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
  }, []);

  const pendingShadowCount = shadowQueue.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#080A0F] text-zinc-100 flex font-sans selection:bg-sky-500/20 selection:text-sky-200" dir="ltr">
      
      {/* Collapsible Executive Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shadowCount={pendingShadowCount}
        environmentMode={environmentMode}
        setEnvironmentMode={setEnvironmentMode}
        privacySettings={privacySettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Workspace Area (Margin accommodates left sidebar width) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${isSidebarCollapsed ? 'ml-14' : 'ml-56'}`}>
        
        {/* Top Header with integrated channel switcher */}
        <AppleGlassHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          shadowCount={pendingShadowCount}
          environmentMode={environmentMode}
          setEnvironmentMode={setEnvironmentMode}
          privacySettings={privacySettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          channels={channels}
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          onTriggerPulsePing={handleTriggerPulsePing}
        />

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-3.5 space-y-3">
          
          {/* Active Viewport */}
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
                authFetch('/api/pipeline/state')
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
                authFetch('/api/pipeline/state')
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.channels) setChannels(d.channels);
                    if (d.shadowQueue) setShadowQueue(d.shadowQueue);
                  });
              }}
            />
          )}
        </main>

        {/* Global Settings & Privacy Modal */}
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

        {/* Clean Developer Status Footer */}
        <footer className="w-full border-t border-[#161B29] bg-[#07090E] py-2 px-4 text-[11px] text-zinc-500 font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-zinc-400 font-semibold">Embednet OS Core</span>
              <span>•</span>
              <span className="text-zinc-500">Multi-Channel Messaging Middleware</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-zinc-400">Mode: {environmentMode.toUpperCase()}</span>
              <span>•</span>
              <span className="text-zinc-500">Fast SQLite & AES-256 Vault</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

