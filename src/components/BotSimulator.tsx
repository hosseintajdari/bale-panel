import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Check,
  CheckCheck,
  Smartphone,
  Sliders,
  ChevronRight,
  Info,
  Terminal,
  FileCode,
  Zap,
  Mic,
  Smile,
  MoreVertical,
  Phone,
  Video,
  UserCheck,
  Edit3,
  Wand2,
  Trash2,
  RefreshCw,
  Library,
  Layers,
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';
import { BOT_PRESETS } from '../data/botTemplates';
import { PROMPT_TEMPLATES } from '../data/promptTemplates';
import { BotPreset, ChatMessage, PromptTemplate } from '../types';

interface BotSimulatorProps {
  initialPlatform?: 'telegram' | 'whatsapp';
  externalPrefill?: string;
  onClearExternalPrefill?: () => void;
}

const QUICK_PROMPT_MODIFIERS = [
  { label: '+ Concise (Mobile)', text: ' Keep all responses under 2-3 short sentences, optimized for rapid mobile reading.' },
  { label: '+ Emojis & Warmth', text: ' Use a friendly, warm tone with appropriate emojis on key points.' },
  { label: '+ Strict WhatsApp MD', text: ' Format key terms in *bold*, code in `monospace`, and organize lists with clean bullet points.' },
  { label: '+ Order Support Rules', text: ' Ask for a 4-digit order number (#1029 is Out for Delivery, #2041 is Shipped, #3099 is Processing).' },
  { label: '+ Dev / Code Focus', text: ' Provide pure TypeScript/Node.js snippets with zero fluff and concise explanations.' }
];

export const BotSimulator: React.FC<BotSimulatorProps> = ({
  initialPlatform = 'telegram',
  externalPrefill,
  onClearExternalPrefill,
}) => {
  const [platform, setPlatform] = useState<'telegram' | 'whatsapp'>(initialPlatform);
  const [selectedPreset, setSelectedPreset] = useState<BotPreset>(BOT_PRESETS[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('customer-support-agent');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(
    BOT_PRESETS[0].systemInstruction
  );
  const [personaName, setPersonaName] = useState<string>(BOT_PRESETS[0].name);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [enableTools, setEnableTools] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [promptSavedFlash, setPromptSavedFlash] = useState<boolean>(false);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content:
        platform === 'telegram'
          ? '👋 Hello! I am your Telegram AI assistant powered by Google Gemini (`gemini-3.7-flash`). How can I help you today?'
          : '👋 Hello! Welcome to our official WhatsApp AI assistant. How may I assist you with your questions, orders, or translations today?',
      timestamp: '12:00 PM',
      status: 'read',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string>('image/jpeg');

  // Upload guardrails (#67, #82): Gemini inlineData supports these types;
  // anything else (or >2 MiB) is rejected before it reaches state or the API.
  const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastApiPayload, setLastApiPayload] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle external prefill prompt
  useEffect(() => {
    if (externalPrefill && externalPrefill.trim()) {
      setInputPrompt(externalPrefill);
      if (onClearExternalPrefill) {
        onClearExternalPrefill();
      }
    }
  }, [externalPrefill, onClearExternalPrefill]);

  // Handle Preset Change
  const handleSelectPreset = (preset: BotPreset) => {
    setSelectedPreset(preset);
    setCustomSystemInstruction(preset.systemInstruction);
    setPersonaName(preset.name);
    setTemperature(preset.temperature);
    if (preset.platform) {
      setPlatform(preset.platform);
    }
    
    // Add system notification in chat preview
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-preset-${Date.now()}`,
        role: 'system',
        content: `🎭 Active Persona switched to: "${preset.name}". Gemini instance will now follow this persona instruction.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Apply Prompt & trigger feedback
  const handleApplyPrompt = () => {
    setPromptSavedFlash(true);
    setTimeout(() => setPromptSavedFlash(false), 2000);

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-prompt-${Date.now()}`,
        role: 'system',
        content: `✨ System Prompt updated (${customSystemInstruction.trim().split(/\s+/).length} words). Gemini instance will use this context for all new queries.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Handle Prompt Template Selection
  const handleSelectPromptTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setPersonaName(template.personaTitle);
    setCustomSystemInstruction(template.systemPrompt);
    setTemperature(template.recommendedTemp);
    setPromptSavedFlash(true);
    setTimeout(() => setPromptSavedFlash(false), 2200);

    // Add system notification in chat preview
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-tmpl-${Date.now()}`,
        role: 'system',
        content: `📋 Applied Prompt Template: "${template.name}" [${template.category}]. System prompt & persona updated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Append modifier snippet to prompt
  const handleAppendModifier = (text: string) => {
    setCustomSystemInstruction((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}${text}` : text.trim();
    });
    setPromptSavedFlash(true);
    setTimeout(() => setPromptSavedFlash(false), 1500);
  };

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rejectFile = (reason: string) => {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `\u26a0\ufe0f Image rejected: ${reason}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      e.target.value = '';
    };

    if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
      rejectFile(`unsupported type "${file.type || 'unknown'}". Use JPEG, PNG, WebP or GIF.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      rejectFile(`file is ${(file.size / 1048576).toFixed(1)} MiB; limit is 2 MiB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage(base64);
      setSelectedImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImageMime('image/jpeg');
  };

  // Clear or Reset Chat
  const handleResetSession = async () => {
    const newSession = `sess_${Date.now()}`;
    setSessionId(newSession);
    clearSelectedImage();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content:
          platform === 'telegram'
            ? `🔄 Session memory cleared! Ready for new queries under persona "${personaName}".`
            : `🔄 Memory reset! Starting a clean WhatsApp conversation under persona "${personaName}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      },
    ]);

    try {
      await fetch('/api/bot/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // ignore
    }
  };

  // Send message to Gemini server
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputPrompt;
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text.trim() || '[Attached an image]',
      image: selectedImage ? `data:${selectedImageMime};base64,${selectedImage}` : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    const currentImg = selectedImage;
    clearSelectedImage();
    setIsLoading(true);

    const payload = {
      sessionId,
      platform,
      message: text.trim(),
      imageBase64: currentImg || undefined,
      imageMimeType: currentImg ? selectedImageMime : undefined,
      systemInstruction: customSystemInstruction,
      temperature,
      enableTools,
    };

    setLastApiPayload({
      endpoint: 'POST /api/bot/chat',
      model: 'gemini-3.7-flash',
      request: {
        systemInstruction: customSystemInstruction,
        temperature,
        contents: [
          { role: 'user', parts: currentImg ? [{ text: text.trim() }, { inlineData: 'image/jpeg [base64]' }] : [{ text: text.trim() }] }
        ]
      }
    });

    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
      setLastApiPayload((prev: any) => ({
        ...prev,
        response: {
          reply: data.reply,
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `⚠️ Error: ${err.message || 'Failed to connect to Gemini API.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Preset Controls & Configuration */}
      <div className="lg:col-span-4 space-y-4">
        {/* Platform Picker */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
          <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] block mb-2 font-mono">
            TARGET_PLATFORM
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="platform-telegram-btn"
              onClick={() => setPlatform('telegram')}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded border text-xs font-mono font-medium transition-all cursor-pointer ${
                platform === 'telegram'
                  ? 'bg-[#24A1DE]/15 text-[#24A1DE] border-[#24A1DE]/40'
                  : 'bg-[#161616] text-[#888888] border-[#2A2A2A] hover:text-[#CCCCCC]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#24A1DE]" />
              <span>Telegram Bot</span>
            </button>
            <button
              id="platform-whatsapp-btn"
              onClick={() => setPlatform('whatsapp')}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded border text-xs font-mono font-medium transition-all cursor-pointer ${
                platform === 'whatsapp'
                  ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/40'
                  : 'bg-[#161616] text-[#888888] border-[#2A2A2A] hover:text-[#CCCCCC]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp Bot</span>
            </button>
          </div>
        </div>

        {/* System Prompt & Persona Customizer */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <label
              htmlFor="gemini-system-prompt-input"
              className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] flex items-center gap-1.5 font-mono"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              SYSTEM_PROMPT_&_PERSONA
            </label>
            <span className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              gemini-3.7-flash
            </span>
          </div>

          {/* Prompt Template Library Dropdown */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="prompt-template-select"
                className="text-[11px] font-mono text-purple-300 font-medium flex items-center gap-1.5"
              >
                <Library className="w-3.5 h-3.5 text-purple-400" />
                <span>Prompt Template Library:</span>
              </label>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                8 Pre-built
              </span>
            </div>

            <select
              id="prompt-template-select"
              value={selectedTemplateId}
              onChange={(e) => handleSelectPromptTemplate(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#333333] hover:border-purple-500/50 rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-purple-500 font-mono cursor-pointer transition-colors"
            >
              <option value="" disabled>-- Select a Pre-Built Persona Template --</option>
              
              <optgroup label="💼 Customer Support & Sales">
                {PROMPT_TEMPLATES.filter((t) => t.category === 'Support' || t.category === 'Sales').map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </optgroup>

              <optgroup label="🛠️ Engineering & Diagnostics">
                {PROMPT_TEMPLATES.filter((t) => t.category === 'Engineering').map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </optgroup>

              <optgroup label="🎨 Creative & Content">
                {PROMPT_TEMPLATES.filter((t) => t.category === 'Creative').map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </optgroup>

              <optgroup label="⚡ Productivity & Coaching">
                {PROMPT_TEMPLATES.filter((t) => t.category === 'Productivity' || t.category === 'Coaching').map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Selected Template Highlights & Sample Prompts */}
            {(() => {
              const currentTmpl = PROMPT_TEMPLATES.find((t) => t.id === selectedTemplateId);
              if (!currentTmpl) return null;
              return (
                <div className="pt-1.5 space-y-1.5 text-[11px] font-mono border-t border-[#262626]">
                  <p className="text-[#999999] text-[10px] leading-relaxed">
                    {currentTmpl.description}
                  </p>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#666666] block mb-1">
                      Quick Test Prompts:
                    </span>
                    <div className="space-y-1">
                      {currentTmpl.sampleInputs.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputPrompt(sample)}
                          className="w-full text-left text-[10px] text-[#BBBBBB] hover:text-purple-300 bg-[#0F0F0F] hover:bg-[#1C1C1C] border border-[#222222] hover:border-purple-500/40 rounded px-2 py-1 transition-all truncate flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-1">"{sample}"</span>
                          <ArrowRight className="w-3 h-3 text-[#555555] group-hover:text-purple-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Persona Name input */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] mb-1">
              <span>Persona Title:</span>
              <span className="text-[10px] text-[#666666]">e.g. Apex Store Concierge</span>
            </div>
            <input
              id="persona-name-input"
              type="text"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              placeholder="e.g. Senior Tech Architect / Sales Concierge"
              className="w-full bg-[#0D0D0D] border border-[#222222] rounded-lg px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* System Prompt Textarea */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] mb-1">
              <span>System Prompt Instruction:</span>
              <span className="text-[10px] text-[#666666]">
                {customSystemInstruction.length} chars • {customSystemInstruction.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              id="gemini-system-prompt-input"
              ref={promptInputRef}
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              rows={4}
              className="w-full bg-[#0D0D0D] border border-[#222222] rounded-lg p-2.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-purple-500/60 font-mono leading-relaxed resize-y"
              placeholder="Define exact persona, behavior, boundaries, and formatting rules for the Gemini instance..."
            />
          </div>

          {/* Quick Modifier Injection Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#666666] block mb-1.5 font-mono">
              QUICK_MODIFIERS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPT_MODIFIERS.map((mod, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendModifier(mod.text)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] hover:bg-[#202020] text-[#AAAAAA] hover:text-white border border-[#222222] hover:border-[#333333] transition-all cursor-pointer"
                >
                  {mod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row: Apply & Clear */}
          <div className="flex items-center gap-2 pt-1">
            <button
              id="apply-system-prompt-btn"
              type="button"
              onClick={handleApplyPrompt}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                promptSavedFlash
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 hover:text-white'
              }`}
            >
              {promptSavedFlash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Persona Active in Gemini!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Apply to Live Preview</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomSystemInstruction(selectedPreset.systemInstruction);
                setPersonaName(selectedPreset.name);
              }}
              title="Reset to selected preset prompt"
              className="p-1.5 bg-[#161616] hover:bg-[#222222] border border-[#2A2A2A] rounded text-[#888888] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomSystemInstruction('');
                setPersonaName('Neutral Assistant');
              }}
              title="Clear prompt"
              className="p-1.5 bg-[#161616] hover:bg-[#222222] border border-[#2A2A2A] rounded text-[#888888] hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Model Controls */}
          <div className="pt-2 border-t border-[#222222] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#777777]">Creativity (Temp): {temperature}</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-28 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tool-toggle"
                  checked={enableTools}
                  onChange={(e) => setEnableTools(e.target.checked)}
                  className="rounded bg-[#161616] border-[#333333] text-purple-500 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="tool-toggle" className="text-[#888888] cursor-pointer text-xs">
                  Simulate Tools / Mock APIs
                </label>
              </div>
              <button
                onClick={() => setShowInspector(!showInspector)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                {showInspector ? 'Hide Payload' : 'Raw Payload'}
              </button>
            </div>
          </div>
        </div>

        {/* Bot Persona Presets */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
          <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] block mb-2.5 font-mono">
            PERSONA_PRESET_LIBRARY
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {BOT_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] border-purple-500/50 text-white shadow-sm'
                      : 'bg-[#141414] border-[#222222] text-[#888888] hover:bg-[#181818] hover:text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono ${
                      preset.platform === 'telegram'
                        ? 'bg-[#24A1DE]/20 text-[#24A1DE]'
                        : 'bg-[#25D366]/20 text-[#25D366]'
                    }`}
                  >
                    {preset.platform === 'telegram' ? 'TG' : 'WA'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">{preset.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#222222] text-[#888888] uppercase">
                        {preset.platform}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777777] mt-0.5 line-clamp-1">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Sample Prompts for active preset */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
          <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] block mb-2 font-mono">
            SAMPLE_PERSONA_QUERIES
          </label>
          <div className="flex flex-col gap-1.5">
            {selectedPreset.sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-left text-xs p-2 rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] text-[#888888] hover:text-white transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate font-mono text-[11px]">{q}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-purple-400 shrink-0 ml-1 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Live Chat Messenger Mockup & Live Stream Log */}
      <div className="lg:col-span-8 space-y-4">
        {/* Messenger Container */}
        <div
          className={`rounded-xl border shadow-xl overflow-hidden flex flex-col h-[620px] transition-all ${
            platform === 'telegram'
              ? 'bg-[#0D0D0D] border-[#222222]'
              : 'bg-[#0D0D0D] border-[#222222]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b ${
              platform === 'telegram'
                ? 'bg-[#141414] border-[#222222] text-[#E0E0E0]'
                : 'bg-[#141414] border-[#222222] text-[#E0E0E0]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-sm text-xs font-mono ${
                  platform === 'telegram'
                    ? 'bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/40'
                    : 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                }`}
              >
                {platform === 'telegram' ? 'TG' : 'WA'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-xs tracking-wide text-white">
                    {personaName || (platform === 'telegram' ? '@GeminiNodeBot' : 'Gemini AI Assistant')}
                  </h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-[#777777] font-mono">
                  {platform === 'telegram' ? 'TELEGRAM_BOT • POLLING_ACTIVE' : 'WHATSAPP_BAILEYS • SOCKET_CONNECTED'}
                </p>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center space-x-2">
              <button
                id="edit-persona-header-btn"
                onClick={() => promptInputRef.current?.focus()}
                title="Edit System Prompt Persona"
                className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] rounded text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Persona Prompt</span>
              </button>
              <button
                id="reset-chat-btn"
                onClick={handleResetSession}
                title="Reset conversation memory (/reset)"
                className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] rounded text-[11px] font-mono text-[#AAAAAA] hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-red-400" />
                <span>/reset</span>
              </button>
            </div>
          </div>

          {/* Active Persona Context Strip */}
          <div className="px-4 py-1.5 bg-[#0A0A0A] border-b border-[#1E1E1E] flex items-center justify-between text-[11px] font-mono text-[#888888]">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="text-purple-400 font-bold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                PERSONA:
              </span>
              <span className="text-[#AAAAAA] truncate" title={customSystemInstruction}>
                &quot;{customSystemInstruction.slice(0, 75)}{customSystemInstruction.length > 75 ? '...' : ''}&quot;
              </span>
            </div>
            <button
              onClick={() => promptInputRef.current?.focus()}
              className="text-[10px] text-purple-400 hover:text-purple-300 underline shrink-0 cursor-pointer"
            >
              Modify
            </button>
          </div>

          {/* Chat Messages List */}
          <div
            className={`flex-1 p-4 overflow-y-auto space-y-3 ${
              platform === 'telegram'
                ? 'bg-[#0A0A0A]'
                : 'bg-[#0A0A0A]'
            }`}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="px-2.5 py-1 bg-[#161616] text-purple-300 border border-purple-500/20 rounded text-[11px] font-mono max-w-[90%] text-center">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono text-white shrink-0 mb-1 ${
                        platform === 'telegram' ? 'bg-[#24A1DE]/20 text-[#24A1DE]' : 'bg-[#25D366]/20 text-[#25D366]'
                      }`}
                    >
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 shadow-sm relative ${
                      isUser
                        ? platform === 'telegram'
                          ? 'bg-[#1E3A5F] text-white border border-[#2B4C7E]'
                          : 'bg-[#143D2B] text-white border border-[#1C5A3F]'
                        : 'bg-[#141414] text-[#E0E0E0] border border-[#262626]'
                    }`}
                  >
                    {/* User Image Attachment */}
                    {msg.image && (
                      <div className="mb-2 rounded overflow-hidden max-h-48 border border-white/10">
                        <img
                          src={msg.image}
                          alt="Uploaded attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Text Body formatted */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    {/* Timestamp & Status */}
                    <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] font-mono text-[#777777]">
                      <span>{msg.timestamp}</span>
                      {isUser && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-sky-400 inline" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-500 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded bg-[#222222] flex items-center justify-center text-[10px] font-bold text-[#AAAAAA] shrink-0 mb-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-end space-x-2 justify-start">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono text-white shrink-0 mb-1 ${
                    platform === 'telegram' ? 'bg-[#24A1DE]/20 text-[#24A1DE]' : 'bg-[#25D366]/20 text-[#25D366]'
                  }`}
                >
                  AI
                </div>
                <div className="rounded-lg p-3 bg-[#141414] border border-[#262626] text-xs font-mono text-[#888888]">
                  <div className="flex items-center space-x-2">
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>gemini-3.7-flash evaluating persona & context...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Slash Commands Toolbar (Telegram) or Quick Actions (WhatsApp) */}
          <div className="px-3 py-1.5 border-t border-[#222222] bg-[#111111] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <span className="text-[#666666] uppercase font-bold mr-1">QUICK_CMDS:</span>
            <button
              onClick={() => handleSendMessage('/help')}
              className="px-2 py-0.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#AAAAAA] hover:text-white border border-[#2A2A2A] rounded transition-all cursor-pointer"
            >
              /help
            </button>
            <button
              onClick={() => handleSendMessage('Where is my order #1029?')}
              className="px-2 py-0.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#AAAAAA] hover:text-white border border-[#2A2A2A] rounded transition-all cursor-pointer"
            >
              /order #1029
            </button>
            <button
              onClick={() => handleSendMessage('Give me a 3-bullet summary of your capabilities')}
              className="px-2 py-0.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#AAAAAA] hover:text-white border border-[#2A2A2A] rounded transition-all cursor-pointer"
            >
              /capabilities
            </button>
            <button
              onClick={handleResetSession}
              className="px-2 py-0.5 bg-[#1A1A1A] hover:bg-[#222222] text-red-400 hover:text-red-300 border border-[#2A2A2A] rounded transition-all cursor-pointer"
            >
              /reset
            </button>
          </div>

          {/* Selected Image Preview before sending */}
          {selectedImage && (
            <div className="px-4 py-2 bg-[#141414] border-t border-[#222222] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={`data:${selectedImageMime};base64,${selectedImage}`}
                  alt="Preview"
                  className="w-8 h-8 rounded object-cover border border-[#333333]"
                />
                <span className="text-xs text-[#AAAAAA] font-mono">Image attached (Gemini Vision Part)</span>
              </div>
              <button
                onClick={() => clearSelectedImage()}
                className="text-xs text-red-400 hover:text-red-300 font-mono cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div className="p-3 border-t border-[#222222] bg-[#111111] flex items-center space-x-2">
            {/* File upload trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo for Gemini Vision"
              className="p-2 text-[#777777] hover:text-white rounded hover:bg-[#1A1A1A] border border-[#222222] transition-all shrink-0 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              id="bot-chat-message-input"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                platform === 'telegram'
                  ? `Message ${personaName}...`
                  : `Type a message to ${personaName}...`
              }
              className="flex-1 rounded px-3 py-1.5 text-xs text-white bg-[#0D0D0D] border border-[#222222] focus:border-purple-500/60 focus:outline-none font-mono"
            />

            {/* Send Button */}
            <button
              id="bot-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputPrompt.trim() && !selectedImage)}
              className={`p-2 rounded font-semibold text-white transition-all shrink-0 cursor-pointer ${
                isLoading || (!inputPrompt.trim() && !selectedImage)
                  ? 'bg-[#1A1A1A] text-[#555555] border border-[#222222] cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-md'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Interaction Stream */}
        <div className="bg-[#0D0D0D] border border-[#222222] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-[#111111] border-b border-[#222222] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#666666] font-bold font-mono">
                Live Interaction Stream
              </h3>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono rounded border border-purple-500/20">
                Active Persona: {personaName}
              </span>
            </div>
            <span className="text-[10px] text-[#666666] font-mono">Runtime: Node.js / Express</span>
          </div>

          <div className="font-mono text-[11px] p-4 space-y-2 text-[#888888]">
            <div className="flex gap-3">
              <span className="text-[#444444]">[14:22:01]</span>
              <span className="text-purple-400 font-bold">SYSTEM_PROMPT</span>
              <span className="text-white truncate">&quot;{customSystemInstruction.slice(0, 60)}...&quot;</span>
            </div>
            <div className="flex gap-3">
              <span className="text-[#444444]">[14:22:02]</span>
              <span className="text-blue-400 font-bold">INCOMING</span>
              <span className="text-white">{platform === 'telegram' ? 'TG:user_982' : 'WA:1203'}</span>
              <span className="text-[#666666] truncate">&quot;{messages[messages.length - 1]?.content.slice(0, 45)}...&quot;</span>
            </div>
            <div className="flex gap-3">
              <span className="text-[#444444]">[14:22:03]</span>
              <span className="text-green-400 font-bold">SUCCESS</span>
              <span className="text-white">GEMINI 3.7:</span>
              <span className="text-gray-300">Context-aware persona response returned and rendered.</span>
            </div>
          </div>
        </div>

        {/* JSON Inspector View */}
        {showInspector && (
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 font-semibold flex items-center gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5" />
                Raw @google/genai API Config & Payload
              </span>
              <span className="text-[#666666] text-[10px]">model: gemini-3.7-flash</span>
            </div>
            <pre className="p-3 bg-[#0A0A0A] rounded overflow-x-auto text-[#AAAAAA] max-h-48 border border-[#222222] leading-relaxed text-[11px]">
              {JSON.stringify(
                lastApiPayload || {
                  model: 'gemini-3.7-flash',
                  systemInstruction: customSystemInstruction,
                  temperature,
                  enableTools,
                  platform,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

