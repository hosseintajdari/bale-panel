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
import { usePipelineStore } from './store/usePipelineStore';
import { useAppStore } from './store/useAppStore';
import { authFetch } from './utils/api';
import { useShadowStream } from './hooks/useShadowStream';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [operatorSecret, setOperatorSecret] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const {
    environmentMode,
    activeSessionId,
    shadowQueue,
    latestPipelineTrace,
    latestPipelineRecord,
    setEnvironmentMode,
    setActiveSessionId,
    setShadowQueue,
    processMessage,
    handleShadowAction,
    fetchInitialState: fetchPipelineInitialState,
  } = usePipelineStore();

  const {
    activeChannel,
    channels,
    privacySettings,
    pulseConfig,
    setActiveChannel,
    setChannels,
    setPrivacySettings,
    setPulseConfig,
    fetchInitialState: fetchAppInitialState,
    triggerPulsePing,
  } = useAppStore();

  // SSE: subscribe to real-time shadow queue updates from the server (Refs #8 Phase 6a)
  useShadowStream();

  useEffect(() => {
    authFetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPipelineInitialState();
    fetchAppInitialState();

    // Poll for new shadow items from backend engines
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchPipelineInitialState();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, fetchPipelineInitialState, fetchAppInitialState]);

  // Periodic Telemetry Pulse Check
  useEffect(() => {
    if (!isAuthenticated || !pulseConfig.enabled) return;

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
  }, [isAuthenticated, pulseConfig.enabled, pulseConfig.refreshIntervalSec, setChannels, setPulseConfig]);

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

  const pendingShadowCount = shadowQueue.filter((s) => s.status === 'pending').length;

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    const response = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: operatorSecret }),
    });
    setOperatorSecret('');
    if (!response.ok) {
      setLoginError('Operator secret was not accepted.');
      return;
    }
    setIsAuthenticated(true);
  };

  if (isAuthenticated !== true) {
    return (
      <main className="min-h-screen bg-[#080A0F] text-zinc-100 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h1 className="text-lg font-semibold">Bale Panel operator sign-in</h1>
          <p className="text-sm text-zinc-400">Enter the local operator secret. It is used only to create an HttpOnly session.</p>
          <input type="password" value={operatorSecret} onChange={(event) => setOperatorSecret(event.target.value)} autoComplete="current-password" required className="w-full rounded bg-zinc-800 px-3 py-2" />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button type="submit" className="w-full rounded bg-sky-600 px-3 py-2 font-medium">Sign in</button>
        </form>
      </main>
    );
  }

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
          onTriggerPulsePing={triggerPulsePing}
        />

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-3.5 space-y-3">
          
          {/* Active Viewport */}
          {activeTab === 'console' && (
            <PipelineConsole
              onOpenShadowReview={() => setActiveTab('shadow')}
            />
          )}

          {activeTab === 'whatsapp-hub' && (
            <EvolutionWhatsAppHub
              onShadowUpdated={() => fetchPipelineInitialState()}
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
                fetchPipelineInitialState();
                fetchAppInitialState();
              }}
            />
          )}
        </main>

        {/* Agent Command Input Dock */}
        <AgentCommandDock onSendMessage={(text, model) => processMessage(activeChannel, `Operator (${model})`, text)} />

        {/* Global Settings & Privacy Modal */}
        <SettingsMenuModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          privacySettings={privacySettings}
          onUpdatePrivacySettings={setPrivacySettings}
          onNavigateToTab={setActiveTab}
          pulseConfig={pulseConfig}
          onUpdatePulseConfig={setPulseConfig}
          channels={channels}
          onTriggerPulsePing={triggerPulsePing}
          onUpdateChannels={setChannels}
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
          onSelect={(text) => processMessage(activeChannel, 'gemini-1.5-pro', text)}
        />
      </div>
    </div>
  );
}
