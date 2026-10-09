import React, { useState } from 'react';
import {
  Plus,
  Mic,
  ArrowUp,
  Sparkles,
  Paperclip,
  Terminal,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AgentCommandDockProps {
  onSendMessage: (message: string, model: string) => void;
  isProcessing?: boolean;
}

// The only model the pipeline engine actually serves (src/server/pipeline/engine.ts).
// The picker was removed: offering other engines was cosmetic (#81).
const ENGINE_MODEL_ID = 'gemini-2.0-flash';
const ENGINE_MODEL_LABEL = 'Gemini 2.0 Flash';

export const AgentCommandDock: React.FC<AgentCommandDockProps> = ({
  onSendMessage,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim(), ENGINE_MODEL_ID);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-3 select-none">
      <div className="relative bg-[#0E121A] border border-[#222838] hover:border-zinc-700 transition-colors rounded-2xl shadow-2xl p-2 flex items-center gap-2">
        {/* Left: Attachment & Action Plus Button */}
        <button
          type="button"
          title="Add context, file or tools (@ to mention, / for actions)"
          className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Center: Command Input */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start with a goal..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans px-2 py-1"
          />
        </div>

        {/* Right Controls: Model Switcher, Mic, Sound, Send */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Engine badge — the pipeline only serves gemini-2.0-flash (#81) */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-mono"
            title="Fixed agent engine — model switching is not implemented server-side"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="font-medium text-[11px]">{ENGINE_MODEL_LABEL}</span>
            <span className="text-[9px] px-1 rounded bg-white/[0.06] text-zinc-400">Fast</span>
          </div>

          {/* Voice Input Mic */}
          <button
            type="button"
            title="Voice prompt"
            className="w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Sound / Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute agent responses" : "Mute agent responses"}
            className="w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-600" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            title="Submit instruction (Enter)"
            className="w-8 h-8 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-md"
          >
            <ArrowUp className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
