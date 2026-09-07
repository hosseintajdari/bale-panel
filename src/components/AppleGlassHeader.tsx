import React from 'react';
import { Shield, Sparkles, Activity, Layers, Bell, CheckCircle2, AlertCircle, Sliders, ShieldCheck, Database, History } from 'lucide-react';
import { GlobalPrivacySettings } from '../types';

interface AppleGlassHeaderProps {
  activeTab: 'console' | 'whatsapp-hub' | 'shadow' | 'ledger' | 'integrations' | 'code-generator' | 'history';
  setActiveTab: (tab: 'console' | 'whatsapp-hub' | 'shadow' | 'ledger' | 'integrations' | 'code-generator' | 'history') => void;
  shadowCount: number;
  environmentMode: 'shadow' | 'live';
  setEnvironmentMode: (mode: 'shadow' | 'live') => void;
  privacySettings?: GlobalPrivacySettings;
  onOpenSettings?: () => void;
}

export const AppleGlassHeader: React.FC<AppleGlassHeaderProps> = ({
  activeTab,
  setActiveTab,
  shadowCount,
  environmentMode,
  setEnvironmentMode,
  privacySettings,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#090b10]/75 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Window Dots + Brand Identity */}
          <div className="flex items-center space-x-4">
            {/* macOS Window dots */}
            <div className="hidden sm:flex items-center space-x-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/50 inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/50 inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/50 inline-block shadow-sm" />
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-white/[0.12] to-white/[0.02] border border-white/[0.15] flex items-center justify-center shadow-inner">
                <Layers className="w-4 h-4 text-zinc-100" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold tracking-tight text-white font-sans">
                    Embednet OS
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-400">
                    Console v4.1
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-sans truncate max-w-[200px] sm:max-w-none">
                  Unified Messaging & Executive Orchestration
                </span>
              </div>
            </div>
          </div>

          {/* Center: Apple-style Glass Segmented Navigation */}
          <nav className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl shadow-inner">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === 'console'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              کنسول و گیت‌وی
            </button>

            <button
              onClick={() => setActiveTab('whatsapp-hub')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'whatsapp-hub'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <span>اتصال واتساپ (ضد بلاک)</span>
            </button>

            <button
              onClick={() => setActiveTab('shadow')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'shadow'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <span>بازبینی سایه</span>
              {shadowCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {shadowCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              دفتر کار سشن‌ها
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === 'integrations'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              استودیو و اکانت‌های هوش مصنوعی
            </button>

            <button
              onClick={() => setActiveTab('code-generator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === 'code-generator'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              تولیدکننده کد (AI)
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'history'
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border border-white/[0.12]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>تاریخچه و حسابرسی</span>
            </button>
          </nav>

          {/* Right: Environment Mode, Privacy/Retention, and Settings */}
          <div className="flex items-center space-x-2.5">
            {/* Global Privacy / Retention Status Pill & Quick Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-xl text-xs transition-all border cursor-pointer ${
                privacySettings?.retentionPolicy === 'ephemeral'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
              }`}
              title="تنظیمات حریم خصوصی و نگهداری داده‌ها (Data Privacy & Retention)"
            >
              {privacySettings?.retentionPolicy === 'ephemeral' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Database className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden sm:inline font-mono text-[11px]">
                {privacySettings?.retentionPolicy === 'ephemeral' ? 'حریم خصوصی: سشن موقت' : 'حریم خصوصی: ثبت دفتر کار'}
              </span>
              <Sliders className="w-3.5 h-3.5 text-zinc-400 mr-1 hover:text-white transition-colors" />
            </button>

            {/* Mode Switcher */}
            <div className="hidden lg:flex items-center p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
              <button
                onClick={() => setEnvironmentMode('shadow')}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium flex items-center space-x-1 ${
                  environmentMode === 'shadow'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="BALE_LLM_MODE=shadow (Safe Pre-flight)"
              >
                <Shield className="w-3 h-3" />
                <span>حالت سایه</span>
              </button>

              <button
                onClick={() => setEnvironmentMode('live')}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium flex items-center space-x-1 ${
                  environmentMode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="ارسال زنده به پیام‌رسان"
              >
                <Activity className="w-3 h-3" />
                <span>زنده</span>
              </button>
            </div>

            {/* Gateway Health Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">گیت‌وی فعال</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
