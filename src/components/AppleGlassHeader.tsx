import React, { memo } from 'react';
import {
  Terminal,
  PhoneCall,
  ShieldAlert,
  Layers,
  KeyRound,
  Code2,
  History,
  ShieldCheck,
  Database,
  Sliders,
  Zap,
} from 'lucide-react';
import { GlobalPrivacySettings, ChannelGatewayStatus, ChannelPlatform } from '../types';

interface AppleGlassHeaderProps {
  activeTab: 'console' | 'whatsapp-hub' | 'shadow' | 'ledger' | 'integrations' | 'code-generator' | 'history';
  setActiveTab?: (tab: any) => void;
  shadowCount: number;
  environmentMode: 'shadow' | 'live';
  setEnvironmentMode: (mode: 'shadow' | 'live') => void;
  privacySettings?: GlobalPrivacySettings;
  onOpenSettings?: () => void;
  channels?: ChannelGatewayStatus[];
  activeChannel?: ChannelPlatform;
  setActiveChannel?: (channel: ChannelPlatform) => void;
  onTriggerPulsePing?: () => void;
}

const TAB_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'console': { label: 'Pipeline Console', icon: Terminal },
  'whatsapp-hub': { label: 'WhatsApp Gateway', icon: PhoneCall },
  'shadow': { label: 'Shadow Queue', icon: ShieldAlert },
  'ledger': { label: 'WorkLedger', icon: Layers },
  'integrations': { label: 'Vault & Keys', icon: KeyRound },
  'code-generator': { label: 'Code Generator', icon: Code2 },
  'history': { label: 'Audit Logs', icon: History },
};

export const AppleGlassHeader = memo<AppleGlassHeaderProps>(({
  activeTab,
  shadowCount,
  environmentMode,
  privacySettings,
  onOpenSettings,
  channels = [],
  activeChannel,
  setActiveChannel,
  onTriggerPulsePing,
}) => {
  const currentTab = TAB_META[activeTab] || { label: 'Console', icon: Terminal };
  const TabIcon = currentTab.icon;

  return (
    <header className="sticky top-0 z-20 w-full bg-[#0A0C10] border-b border-[#1C202B] h-11 transition-all select-none">
      <div className="w-full h-full px-3.5 flex items-center justify-between">
        
        {/* Left: Active View Breadcrumb */}
        <div className="flex items-center gap-2">
          <TabIcon className="w-3.5 h-3.5 text-zinc-400" />
          <h1 className="text-xs font-semibold text-zinc-100 tracking-tight font-sans">
            {currentTab.label}
          </h1>
          {activeTab === 'shadow' && shadowCount > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {shadowCount} pending
            </span>
          )}
        </div>

        {/* Center: Integrated Gateway Channel Switcher (Sleek Linear segmented control) */}
        {channels.length > 0 && setActiveChannel && (
          <div className="hidden md:flex items-center bg-black/40 p-0.5 rounded-md border border-white/[0.06] text-xs">
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
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.12] text-white font-medium shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={`${ch.displayName} (${ch.latencyMs}ms)`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="uppercase">{ch.id}</span>
                  <span className="text-[10px] text-zinc-500">{ch.latencyMs}ms</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right Status Actions */}
        <div className="flex items-center gap-1.5">
          {/* Manual Ping Trigger */}
          {onTriggerPulsePing && (
            <button
              onClick={onTriggerPulsePing}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
              title="Trigger telemetry pulse ping"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Privacy Retention Badge */}
          {privacySettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
              title="Data Retention Policy"
            >
              {privacySettings.retentionPolicy === 'ephemeral' ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <Database className="w-3 h-3 text-indigo-400" />
              )}
              <span className="hidden sm:inline">
                {privacySettings.retentionPolicy === 'ephemeral' ? 'Ephemeral' : 'Audited'}
              </span>
            </button>
          )}

          {/* Environment Mode Tag */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 border border-white/[0.06]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                environmentMode === 'shadow' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-zinc-400 uppercase">{environmentMode}</span>
          </div>

          {/* Settings Trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
              title="Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
});

AppleGlassHeader.displayName = 'AppleGlassHeader';


