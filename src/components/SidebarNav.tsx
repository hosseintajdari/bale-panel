import React, { memo } from 'react';
import {
  Terminal,
  PhoneCall,
  ShieldAlert,
  Layers,
  KeyRound,
  Code2,
  History,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Sliders,
  Cpu,
} from 'lucide-react';
import { GlobalPrivacySettings } from '../types';

export type TabType = 'console' | 'whatsapp-hub' | 'shadow' | 'ledger' | 'integrations' | 'code-generator' | 'history';

interface SidebarNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  shadowCount: number;
  environmentMode: 'shadow' | 'live';
  setEnvironmentMode: (mode: 'shadow' | 'live') => void;
  privacySettings?: GlobalPrivacySettings;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS: {
  id: TabType;
  label: string;
  badge?: 'shadowCount';
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'console', label: 'Pipeline Console', icon: Terminal },
  { id: 'whatsapp-hub', label: 'WhatsApp Gateway', icon: PhoneCall },
  { id: 'shadow', label: 'Shadow Queue', badge: 'shadowCount', icon: ShieldAlert },
  { id: 'ledger', label: 'WorkLedger', icon: Layers },
  { id: 'integrations', label: 'Vault & Keys', icon: KeyRound },
  { id: 'code-generator', label: 'Code Generator', icon: Code2 },
  { id: 'history', label: 'Audit Logs', icon: History },
];

export const SidebarNav = memo<SidebarNavProps>(({
  activeTab,
  setActiveTab,
  shadowCount,
  environmentMode,
  setEnvironmentMode,
  onOpenSettings,
  isCollapsed,
  setIsCollapsed,
}) => {
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-[#0A0C10] border-r border-[#1C202B] select-none transition-all duration-150 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#1C202B] shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-white/[0.08] border border-white/[0.12] flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5 text-zinc-200" />
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-xs font-semibold text-zinc-100 tracking-tight">Embednet</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                v4.1
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const count = item.badge === 'shadowCount' ? shadowCount : 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left relative ${
                isActive
                  ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge === 'shadowCount' && count > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {count}
                    </span>
                  )}
                </div>
              )}

              {isCollapsed && item.badge === 'shadowCount' && count > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: Mode & Settings */}
      <div className="p-2 border-t border-[#1C202B] space-y-1.5 shrink-0 bg-[#08090C]">
        {!isCollapsed ? (
          <div className="bg-black/40 p-0.5 rounded-md border border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[10px] text-zinc-500 font-mono px-1.5">ENV</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setEnvironmentMode('shadow')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  environmentMode === 'shadow'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                SHADOW
              </button>
              <button
                onClick={() => setEnvironmentMode('live')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  environmentMode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                LIVE
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEnvironmentMode(environmentMode === 'shadow' ? 'live' : 'shadow')}
            className={`w-full p-1.5 rounded-md flex items-center justify-center border text-xs cursor-pointer ${
              environmentMode === 'shadow'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
            title={`Mode: ${environmentMode.toUpperCase()}`}
          >
            {environmentMode === 'shadow' ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings & Retention"
        >
          <Sliders className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
          {!isCollapsed && <span className="text-[11px]">Settings</span>}
        </button>
      </div>
    </aside>
  );
});

SidebarNav.displayName = 'SidebarNav';

