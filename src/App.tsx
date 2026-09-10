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
import { TelegramManager } from './components/TelegramManager';
import { AgentCommandDock } from './components/AgentCommandDock';
import { Zap } from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
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
  const [activeSessionId, setActiveSessionId] = useState('tg-gateway-migration');

  const [latestPipelineTrace, setLatestPipelineTrace] = useState<PipelineTraceStep[] | null>(null);
  const [latestPipelineRecord, setLatestPipelineRecord] = useState<ShadowReviewItem | null>(null);

  const handleSendMessageFromDock = useCallback(async (message: string, model: string) => {
    try {
      const res = await authFetch('/api/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeChannel,
          senderId: activeSessionId,
          senderDisplay: `Operator (${model})`,
          text: message,
          environmentMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shadowRecord) {
          setShadowQueue((prev) => [data.shadowRecord, ...prev]);
          setLatestPipelineRecord(data.shadowRecord);
        }
        if (data.trace) {
          setLatestPipelineTrace(data.trace);
        }
      }
    } catch (err) {
      console.error('Dock dispatch error:', err);
    }
  }, [activeChannel, activeSessionId, environmentMode]);

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

    const intervalMs = Math.max(2, pulseConfig.refreshIntervalSec || 3) * 1000;
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

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
        activeSessionId={activeSessionId}
        onSelectSession={(sid) => {
          setActiveSessionId(sid);
          if (sid.startsWith('tg-')) setActiveTab('telegram-manager');
          else if (sid.startsWith('wa-')) setActiveTab('whatsapp-hub');
          else setActiveTab('console');
        }}
        onNewSession={() => {
          const newId = `sess-${Date.now()}`;
          setActiveSessionId(newId);
          setActiveTab('console');
        }}
      />

      {/* Main Workspace Area (Margin accommodates left sidebar width) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${isSidebarCollapsed ? 'ml-14' : 'ml-64'}`}>
        
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
              latestTrace={latestPipelineTrace}
              latestRecord={latestPipelineRecord}
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

          {activeTab === 'telegram-manager' && (
            <TelegramManager />
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

        {/* Agent Command Input Dock */}
        <AgentCommandDock onSendMessage={handleSendMessageFromDock} />

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
          onUpdateChannels={(updated) => setChannels(updated)}
        />

        {/* Minimalist Telemetry & Status Bar (Hermes / Antigravity Cockpit Style) */}
        <footer className="w-full border-t border-[#1C202B] bg-[#07090E] py-1.5 px-4 text-[11px] text-zinc-400 font-mono select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-300 hover:text-white cursor-pointer transition-colors">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>This device</span>
              </div>
              
              <span className="text-zinc-600">|</span>
              
              {/* Channels Status Inline */}
              <div className="flex items-center gap-2">
                {channels.map((ch) => {
                  const isSelected = activeChannel === ch.id;
                  const dotColor =
                    ch.latencyMs < 45
                      ? 'bg-emerald-400'
                      : ch.latencyMs < 80
                      ? 'bg-sky-400'
                      : 'bg-amber-400';
                  
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch.id)}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        isSelected ? 'bg-white/[0.08] text-white font-medium' : 'hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={`${ch.displayName} (${ch.latencyMs}ms)`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="uppercase text-[10px]">{ch.id} {ch.latencyMs}ms</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-zinc-400">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Smart</span>
              </div>
              <span className="text-zinc-600">•</span>
              <span className="text-blue-400"># v0.21.0 (+1178)</span>
              <span className="text-zinc-600 font-mono text-[10px]">5dde75a</span>
            </div>
          </div>
        </footer>

        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelect={(text) => handleSendMessageFromDock(text, 'gemini-1.5-pro')}
        />
      </div>
    </div>
  );
}

