import React, { useState } from 'react';
import {
  Plus,
  Mic,
  ArrowUp,
  ChevronDown,
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

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', tier: 'Fast' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', tier: 'Reasoning' },
  { id: 'local-mistral', label: 'Hermes-3 Llama-3.1', tier: 'Local' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tier: 'Cloud' },
];

export const AgentCommandDock: React.FC<AgentCommandDockProps> = ({
  onSendMessage,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim(), selectedModel.id);
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What should we tackle? (Ask anything, @ to mention, / for actions)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans px-2 py-1"
          />
        </div>

        {/* Right Controls: Model Switcher, Mic, Sound, Send */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Model Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="font-medium text-[11px]">{selectedModel.label}</span>
              <span className="text-[9px] px-1 rounded bg-white/[0.06] text-zinc-400">{selectedModel.tier}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-52 bg-[#0A0C10] border border-[#222838] rounded-xl shadow-2xl p-1 z-50 space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Select Agent Engine
                </div>
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer text-left ${
                      selectedModel.id === model.id
                        ? 'bg-blue-500/20 text-blue-300 font-medium'
                        : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                    }`}
                  >
                    <span className="truncate">{model.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{model.tier}</span>
                  </button>
                ))}
              </div>
            )}
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
