import React, { memo, useState, useEffect } from 'react';
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
  Send,
  Plus,
  Sparkles,
  MessageSquare,
  FileCode2,
  Clock,
  Download,
  Search,
  Pin,
  Radio,
  Hash,
  Bot,
  CircleDot,
} from 'lucide-react';
import { GlobalPrivacySettings } from '../types';
import { authFetch } from '../utils/api';

export type TabType = 
  | 'console' 
  | 'whatsapp-hub' 
  | 'telegram-manager' 
  | 'shadow' 
  | 'ledger' 
  | 'integrations' 
  | 'code-generator' 
  | 'history'
  | 'capabilities'
  | 'messaging'
  | 'artifacts'
  | 'scheduled-jobs';

export interface SidebarSessionItem {
  sessionId: string;
  channel: string;
  title: string;
  lastMessage: string;
  lastActivity: number;
  messageCount: number;
  pinned?: boolean;
}

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
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onNewSession?: () => void;
}

export const SidebarNav = memo<SidebarNavProps>(({
  activeTab,
  setActiveTab,
  shadowCount,
  environmentMode,
  setEnvironmentMode,
  onOpenSettings,
  isCollapsed,
  setIsCollapsed,
  activeSessionId = 'tg-gateway-migration',
  onSelectSession,
  onNewSession,
}) => {
  const [activeModeTab, setActiveModeTab] = useState<'sessions' | 'bots'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<SidebarSessionItem[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([
    'tg-cognitive-protocol',
    'bale-med-pipeline'
  ]);

  // Load sessions from API or SQLite
  useEffect(() => {
    authFetch('/api/sessions/overview')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      })
      .catch(() => {
        // Fallback default rich sessions
        setSessions([
          {
            sessionId: 'tg-gateway-migration',
            channel: 'telegram',
            title: 'Gateway migration prompts...',
            lastMessage: 'بررسی و تحلیل راهکارهای مهاجرت وب‌هوک به تلگرام و بله',
            lastActivity: Date.now() - 3600 * 24 * 3 * 1000,
            messageCount: 14,
          },
          {
            sessionId: 'bale-med-pipeline',
            channel: 'bale',
            title: 'عیب‌یابی عملکرد ایجنت پایپ‌لاین',
            lastMessage: 'پایش پایداری اتصال خط رله داخلی ایران (bale-med)',
            lastActivity: Date.now() - 3600 * 24 * 2 * 1000,
            messageCount: 8,
          },
          {
            sessionId: 'tg-cognitive-protocol',
            channel: 'telegram',
            title: 'Cognitive And Architectural Protocol',
            lastMessage: 'پروتکل معماری شناختی و همگام‌سازی یادداشت‌ها در نوشن',
            lastActivity: Date.now() - 3600 * 24 * 1000,
            messageCount: 22,
          },
          {
            sessionId: 'wa-patient-triage',
            channel: 'whatsapp',
            title: 'بهینه‌سازی رابط کاربری و عملکرد ایجنت',
            lastMessage: 'ارزیابی پاسخ‌های هوشمند درگاه واتساپ',
            lastActivity: Date.now() - 3600 * 5 * 1000,
            messageCount: 5,
          },
        ]);
      });
  }, []);

  const togglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => pinnedIds.includes(s.sessionId));
  const regularSessions = filteredSessions.filter((s) => !pinnedIds.includes(s.sessionId));

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-[#080A0F] border-r border-[#1C202B] select-none transition-all duration-150 font-sans ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Top Header & Sessions / Bots Toggle */}
      <div className="shrink-0 border-b border-[#1C202B]">
        <div className="h-11 flex items-center justify-between px-3">
          {!isCollapsed ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveModeTab('sessions')}
                className={`px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider transition-colors relative ${
                  activeModeTab === 'sessions'
                    ? 'text-zinc-100 border-b-2 border-blue-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                SESSIONS
              </button>
              <button
                onClick={() => setActiveModeTab('bots')}
                className={`px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider transition-colors relative ${
                  activeModeTab === 'bots'
                    ? 'text-zinc-100 border-b-2 border-blue-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                BOTS
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <Bot className="w-4 h-4 text-zinc-400" />
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3.5 custom-scrollbar text-xs">
        {/* Core Quick Actions */}
        <div className="space-y-0.5">
          {/* New Session Button */}
          <button
            onClick={() => {
              if (onNewSession) onNewSession();
              setActiveTab('console');
            }}
            title="New session (Ctrl + N)"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-400" />
              {!isCollapsed && <span className="text-[12px] font-medium">New session</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500">
                <span className="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08]">Ctrl</span>
                <span className="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08]">N</span>
              </div>
            )}
          </button>

          {/* Capabilities */}
          <button
            onClick={() => setActiveTab('integrations')}
            title="Capabilities & MCP Tools"
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'integrations' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            {!isCollapsed && <span>Capabilities</span>}
          </button>

          {/* Messaging (Channels & Gateways) */}
          <button
            onClick={() => setActiveTab('console')}
            title="Messaging Router"
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'console' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
            {!isCollapsed && <span>Messaging</span>}
          </button>

          {/* Artifacts */}
          <button
            onClick={() => setActiveTab('ledger')}
            title="Artifacts & WorkLedger"
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'ledger' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCode2 className="w-3.5 h-3.5 text-zinc-500" />
              {!isCollapsed && <span>Artifacts</span>}
            </div>
            {!isCollapsed && shadowCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {shadowCount}
              </span>
            )}
          </button>

          {/* Scheduled jobs */}
          <button
            onClick={() => setActiveTab('history')}
            title="Scheduled jobs & Telemetry Pulse"
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'history' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            {!isCollapsed && <span>Scheduled jobs</span>}
          </button>

          {/* Import session */}
          <button
            onClick={() => onOpenSettings()}
            title="Import session or backup"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            {!isCollapsed && <span>Import session</span>}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="relative pt-1">
            <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[#1C202B] rounded-md pl-8 pr-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>
        )}

        {/* Section: PINNED */}
        {!isCollapsed && pinnedSessions.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-500 font-semibold tracking-wider">
              <div className="flex items-center gap-1">
                <Pin className="w-3 h-3 text-blue-400 rotate-45" />
                <span># PINNED</span>
              </div>
              <span className="text-[9px] text-zinc-600">Shift-click to unpin</span>
            </div>

            <div className="space-y-0.5">
              {pinnedSessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={(e) => {
                    if (e.shiftKey) togglePin(session.sessionId, e);
                    else if (onSelectSession) onSelectSession(session.sessionId);
                  }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                    activeSessionId === session.sessionId
                      ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate text-[11px]">{session.title}</span>
                  <Pin
                    onClick={(e) => togglePin(session.sessionId, e)}
                    className="w-3 h-3 text-blue-400 opacity-60 hover:opacity-100 shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: SESSIONS / CHANNELS */}
        {!isCollapsed && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-500 font-semibold tracking-wider">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-zinc-500" />
                <span># SESSIONS</span>
              </div>
            </div>

            {/* Telegram Channel Sessions */}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('telegram-manager')}
                className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 tracking-wider"
              >
                <Send className="w-3 h-3 text-blue-400" />
                <span># TELEGRAM</span>
              </button>

              {regularSessions
                .filter((s) => s.channel === 'telegram')
                .map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(session.sessionId);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                      activeSessionId === session.sessionId
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot className={`w-2.5 h-2.5 shrink-0 ${activeSessionId === session.sessionId ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <span className="truncate text-[11px]">{session.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 shrink-0 ml-1">3d</span>
                  </div>
                ))}
            </div>

            {/* Bale Channel Sessions */}
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => setActiveTab('console')}
                className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-mono font-bold text-sky-400 hover:text-sky-300 tracking-wider"
              >
                <Radio className="w-3 h-3 text-sky-400" />
                <span># BALE</span>
              </button>

              {regularSessions
                .filter((s) => s.channel === 'bale')
                .map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(session.sessionId);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                      activeSessionId === session.sessionId
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot className={`w-2.5 h-2.5 shrink-0 ${activeSessionId === session.sessionId ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <span className="truncate text-[11px]">{session.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 shrink-0 ml-1">2d</span>
                  </div>
                ))}
            </div>

            {/* WhatsApp Channel Sessions */}
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => setActiveTab('whatsapp-hub')}
                className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 tracking-wider"
              >
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                <span># WHATSAPP</span>
              </button>

              {regularSessions
                .filter((s) => s.channel === 'whatsapp')
                .map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(session.sessionId);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                      activeSessionId === session.sessionId
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot className={`w-2.5 h-2.5 shrink-0 ${activeSessionId === session.sessionId ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <span className="truncate text-[11px]">{session.title}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 shrink-0 ml-1">5h</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls: Mode & Settings */}
      <div className="p-2 border-t border-[#1C202B] space-y-1.5 shrink-0 bg-[#06080C]">
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
