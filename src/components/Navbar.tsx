import React from 'react';
import { Bot, MessageSquare, Code2, Cpu, Sparkles, BookOpen, Send } from 'lucide-react';

interface NavbarProps {
  activeTab: 'simulator' | 'notes' | 'mcp' | 'code' | 'architecture' | 'guide' | 'faq';
  setActiveTab: (tab: 'simulator' | 'notes' | 'mcp' | 'code' | 'architecture' | 'guide' | 'faq') => void;
  activePlatform: 'all' | 'telegram' | 'whatsapp';
  setActivePlatform: (platform: 'all' | 'telegram' | 'whatsapp') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activePlatform,
  setActivePlatform,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F0F0F] border-b border-[#222222] text-[#E0E0E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('simulator')}>
            <div className="w-8 h-8 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] rounded-md flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  GEMINI<span className="text-[#666666]">BRIDGE</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#1A1A1A] text-emerald-400 border border-emerald-500/30 rounded">
                  Node.js v20
                </span>
              </div>
              <p className="text-[11px] text-[#888888]">Telegram & WhatsApp Middleware</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Note Taker & Memory DB</span>
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'mcp'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>MCP Tools & WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Node.js Boilerplate</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Architecture & Flows</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-[#1A1A1A] text-white border border-[#444444]'
                  : 'text-[#888888] hover:text-white hover:bg-[#151515]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>5-Min Setup</span>
            </button>
          </nav>

          {/* Right Status & Quick Platform Switcher Badge */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] uppercase tracking-widest text-[#888888] font-mono">
                Service: Active
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-[#141414] p-1 rounded-lg border border-[#2A2A2A]">
              <button
                onClick={() => setActivePlatform('all')}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all ${
                  activePlatform === 'all'
                    ? 'bg-[#222222] text-white'
                    : 'text-[#666666] hover:text-[#AAAAAA]'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setActivePlatform('telegram')}
                className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 transition-all ${
                  activePlatform === 'telegram'
                    ? 'bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/40'
                    : 'text-[#666666] hover:text-[#24A1DE]'
                }`}
              >
                <span>TG</span>
              </button>
              <button
                onClick={() => setActivePlatform('whatsapp')}
                className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 transition-all ${
                  activePlatform === 'whatsapp'
                    ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                    : 'text-[#666666] hover:text-[#25D366]'
                }`}
              >
                <span>WA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-[#222222] text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded whitespace-nowrap text-xs ${
              activeTab === 'simulator' ? 'bg-[#1A1A1A] text-white border border-[#444]' : 'text-[#888888] bg-[#111111]'
            }`}
          >
            Live Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded whitespace-nowrap text-xs ${
              activeTab === 'code' ? 'bg-[#1A1A1A] text-white border border-[#444]' : 'text-[#888888] bg-[#111111]'
            }`}
          >
            Node.js Code
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded whitespace-nowrap text-xs ${
              activeTab === 'architecture' ? 'bg-[#1A1A1A] text-white border border-[#444]' : 'text-[#888888] bg-[#111111]'
            }`}
          >
            Architecture
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded whitespace-nowrap text-xs ${
              activeTab === 'guide' ? 'bg-[#1A1A1A] text-white border border-[#444]' : 'text-[#888888] bg-[#111111]'
            }`}
          >
            Setup Guide
          </button>
        </div>
      </div>
    </header>
  );
};
