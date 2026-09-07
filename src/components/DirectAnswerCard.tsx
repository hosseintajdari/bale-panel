import React from 'react';
import { CheckCircle2, Zap, ShieldCheck, Sparkles, Send, MessageSquare, ArrowRight, Layers, Terminal } from 'lucide-react';

interface DirectAnswerCardProps {
  onExploreSimulator: () => void;
  onExploreCode: () => void;
}

export const DirectAnswerCard: React.FC<DirectAnswerCardProps> = ({
  onExploreSimulator,
  onExploreCode,
}) => {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 sm:p-8 text-[#E0E0E0] relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-80" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-[#1A1A1A] text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-mono flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            DIRECT INTEGRATION SUPPORTED
          </span>
          <span className="px-2.5 py-1 bg-[#1A1A1A] text-blue-400 border border-blue-500/30 rounded text-[11px] font-mono">
            @google/genai Node.js SDK
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Yes, Google Gemini directly powers both WhatsApp and Telegram bots in Node.js.
        </h1>

        <p className="text-[#AAAAAA] text-xs sm:text-sm leading-relaxed max-w-4xl mb-6">
          Capture incoming user text, voice audio, or photos via standard bot frameworks (<code className="text-sky-400 bg-[#1A1A1A] px-1.5 py-0.5 rounded font-mono text-xs border border-[#2A2A2A]">telegraf</code>, <code className="text-sky-400 bg-[#1A1A1A] px-1.5 py-0.5 rounded font-mono text-xs border border-[#2A2A2A]">node-telegram-bot-api</code>, <code className="text-emerald-400 bg-[#1A1A1A] px-1.5 py-0.5 rounded font-mono text-xs border border-[#2A2A2A]">@whiskeysockets/baileys</code>, or <code className="text-emerald-400 bg-[#1A1A1A] px-1.5 py-0.5 rounded font-mono text-xs border border-[#2A2A2A]">Meta Cloud API</code>), stream or generate answers using <code className="text-purple-400 bg-[#1A1A1A] px-1.5 py-0.5 rounded font-mono text-xs border border-[#2A2A2A]">ai.models.generateContent</code>, and deliver structured replies.
        </p>

        {/* 3 Core Metric / Integration Cards in Elegant Dark style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#161616] border border-[#222222] rounded-lg p-4 hover:border-[#3A3A3A] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#666666] font-bold">
                TELEGRAM_BRIDGE
              </span>
              <div className="w-6 h-6 rounded bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center text-xs font-mono font-bold">
                TG
              </div>
            </div>
            <div className="text-white text-sm font-semibold mb-1">Telegraf & Polling/Webhook</div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              Handle commands (<code className="text-sky-400 font-mono">/start</code>, <code className="text-sky-400 font-mono">/reset</code>), streaming text updates, and multimodal photo prompts.
            </p>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded-lg p-4 hover:border-[#3A3A3A] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#666666] font-bold">
                WHATSAPP_BRIDGE
              </span>
              <div className="w-6 h-6 rounded bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-xs font-mono font-bold">
                WA
              </div>
            </div>
            <div className="text-white text-sm font-semibold mb-1">Baileys QR & Meta Cloud API</div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              Scan QR code via terminal for direct socket sync, or register webhook endpoints for enterprise Meta Cloud accounts.
            </p>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded-lg p-4 hover:border-[#3A3A3A] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#666666] font-bold">
                SESSION_&_TOOLS
              </span>
              <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-mono font-bold">
                AI
              </div>
            </div>
            <div className="text-white text-sm font-semibold mb-1">Memory & Function Calling</div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              Map conversation histories per user chat ID, handle image attachments, and trigger custom Node.js tools.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExploreSimulator}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-semibold rounded shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LAUNCH_SIMULATOR</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>

          <button
            onClick={onExploreCode}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222222] text-[#CCCCCC] hover:text-white border border-[#333333] text-xs font-mono rounded flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>VIEW_NODEJS_BOILERPLATE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
