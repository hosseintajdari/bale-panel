import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Sparkles,
  Send,
  Smartphone,
  Layers,
  FileCode,
  CheckCircle2,
  Wand2,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { CODE_TEMPLATES } from '../data/botTemplates';
import { CodeTemplate } from '../types';

export const CodeGeneratorSection: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate>(CODE_TEMPLATES[0]);
  const [activeCodeTab, setActiveCodeTab] = useState<'code' | 'env' | 'package'>('code');
  const [copied, setCopied] = useState<boolean>(false);

  // Custom AI Code Generator State
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);
  const [customPlatform, setCustomPlatform] = useState<'telegram' | 'whatsapp'>('telegram');
  const [customFramework, setCustomFramework] = useState<string>('telegraf');
  const [customBotType, setCustomBotType] = useState<string>('Customer Support Bot');
  const [customRequirements, setCustomRequirements] = useState<string>(
    'Include Redis session store, handle voice notes audio transcription, and add a /stats command.'
  );
  const [generatedCustomCode, setGeneratedCustomCode] = useState<string | null>(null);

  // Handle Copy to Clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Code as File
  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate Custom Code with Gemini
  const handleGenerateCustom = async () => {
    setIsGeneratingCustom(true);
    try {
      const res = await fetch('/api/generate-bot-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: customPlatform,
          framework: customFramework,
          botType: customBotType,
          customRequirements,
          features: ['session-memory', 'vision-multimodal', 'error-handling', 'slash-commands'],
        }),
      });

      const data = await res.json();
      if (data.code) {
        setGeneratedCustomCode(data.code);
      }
    } catch (err) {
      console.error('Custom code generation failed:', err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-[#1A1A1A] text-blue-400 border border-blue-500/30 rounded text-[11px] font-mono">
                BOILERPLATE_TEMPLATES
              </span>
              <span className="px-2.5 py-1 bg-[#1A1A1A] text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-mono">
                TypeScript ESM & @google/genai
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-3 tracking-tight">
              Production Node.js Boilerplate for Gemini Bots
            </h2>
            <p className="text-xs text-[#888888] mt-1 font-mono">
              Select a framework below to inspect complete, runnable Node.js implementations.
            </p>
          </div>
        </div>

        {/* Template Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CODE_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate.id === tmpl.id && !generatedCustomCode;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl);
                  setGeneratedCustomCode(null);
                }}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1A1A] border-[#444444] text-white shadow-sm'
                    : 'bg-[#141414] border-[#222222] text-[#888888] hover:bg-[#181818] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono ${
                        tmpl.platform === 'telegram' ? 'bg-[#24A1DE]/20 text-[#24A1DE]' : 'bg-[#25D366]/20 text-[#25D366]'
                      }`}
                    >
                      {tmpl.platform === 'telegram' ? 'TG' : 'WA'}
                    </div>
                    <span className="font-semibold text-xs capitalize text-white">{tmpl.platform}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222222] font-mono text-[#888888]">
                    {tmpl.framework}
                  </span>
                </div>
                <h3 className="font-semibold text-xs leading-tight line-clamp-1 text-[#E0E0E0]">{tmpl.title}</h3>
                <p className="text-[11px] text-[#777777] mt-1 line-clamp-2">{tmpl.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Box */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-lg">
        {/* Top Control Bar */}
        <div className="bg-[#141414] px-4 py-3 border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#444444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#555555]" />
            </div>
            <span className="text-xs font-mono text-[#CCCCCC] font-semibold flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              {generatedCustomCode
                ? 'custom-gemini-bot.ts (AI Generated)'
                : activeCodeTab === 'code'
                ? selectedTemplate.filename
                : activeCodeTab === 'env'
                ? '.env'
                : 'package.json'}
            </span>
          </div>

          {/* Subtabs & Action Buttons */}
          <div className="flex items-center space-x-2">
            {!generatedCustomCode && (
              <div className="flex bg-[#0D0D0D] p-0.5 rounded border border-[#222222] text-xs font-mono">
                <button
                  onClick={() => setActiveCodeTab('code')}
                  className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                    activeCodeTab === 'code' ? 'bg-[#222222] text-white' : 'text-[#777777] hover:text-white'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setActiveCodeTab('env')}
                  className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                    activeCodeTab === 'env' ? 'bg-[#222222] text-white' : 'text-[#777777] hover:text-white'
                  }`}
                >
                  .env
                </button>
                <button
                  onClick={() => setActiveCodeTab('package')}
                  className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                    activeCodeTab === 'package' ? 'bg-[#222222] text-white' : 'text-[#777777] hover:text-white'
                  }`}
                >
                  package.json
                </button>
              </div>
            )}

            <button
              onClick={() => {
                const text = generatedCustomCode
                  ? generatedCustomCode
                  : activeCodeTab === 'code'
                  ? selectedTemplate.code
                  : activeCodeTab === 'env'
                  ? selectedTemplate.envSnippet
                  : selectedTemplate.packageJsonSnippet;
                handleCopy(text);
              }}
              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#222222] text-[#CCCCCC] hover:text-white border border-[#333333] rounded text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => {
                const text = generatedCustomCode
                  ? generatedCustomCode
                  : activeCodeTab === 'code'
                  ? selectedTemplate.code
                  : activeCodeTab === 'env'
                  ? selectedTemplate.envSnippet
                  : selectedTemplate.packageJsonSnippet;
                const fname = generatedCustomCode
                  ? 'custom-gemini-bot.ts'
                  : activeCodeTab === 'code'
                  ? selectedTemplate.filename
                  : activeCodeTab === 'env'
                  ? '.env.example'
                  : 'package.json';
                handleDownload(fname, text);
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Highlights Banner */}
        {!generatedCustomCode && (
          <div className="bg-[#141414] px-4 py-2 border-b border-[#222222] flex flex-wrap items-center gap-2 text-xs font-mono text-[#888888]">
            <span className="font-semibold text-blue-400 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> HIGHLIGHTS:
            </span>
            {selectedTemplate.highlights.map((h, i) => (
              <span key={i} className="flex items-center gap-1 bg-[#1A1A1A] px-2 py-0.5 rounded text-[11px] text-[#AAAAAA] border border-[#2A2A2A]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Code Content Container */}
        <div className="p-4 sm:p-5 bg-[#0A0A0A] overflow-x-auto max-h-[550px] font-mono text-xs text-[#CCCCCC] leading-relaxed">
          <pre>
            <code>
              {generatedCustomCode
                ? generatedCustomCode
                : activeCodeTab === 'code'
                ? selectedTemplate.code
                : activeCodeTab === 'env'
                ? selectedTemplate.envSnippet
                : selectedTemplate.packageJsonSnippet}
            </code>
          </pre>
        </div>
      </div>

      {/* AI Custom Bot Code Generator Section */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-mono font-bold">
            AI
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              GEMINI_CUSTOM_BOT_GENERATOR
              <span className="px-2 py-0.5 bg-[#1A1A1A] text-purple-400 border border-purple-500/30 rounded text-[10px] font-mono">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-[#888888]">
              Need specific tools, a unique framework, or custom database integration? Let Gemini generate full Node.js code tailored to your specs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] font-mono block mb-1.5">Platform</label>
            <select
              value={customPlatform}
              onChange={(e) => {
                const val = e.target.value as 'telegram' | 'whatsapp';
                setCustomPlatform(val);
                setCustomFramework(val === 'telegram' ? 'telegraf' : 'baileys');
              }}
              className="w-full bg-[#0D0D0D] border border-[#222222] rounded p-2 text-xs text-white focus:border-[#444444] font-mono"
            >
              <option value="telegram">Telegram Bot</option>
              <option value="whatsapp">WhatsApp Bot</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] font-mono block mb-1.5">Framework / Driver</label>
            <select
              value={customFramework}
              onChange={(e) => setCustomFramework(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#222222] rounded p-2 text-xs text-white focus:border-[#444444] font-mono"
            >
              {customPlatform === 'telegram' ? (
                <>
                  <option value="telegraf">Telegraf (Recommended)</option>
                  <option value="node-telegram-bot-api">node-telegram-bot-api</option>
                  <option value="grammy">grammY</option>
                </>
              ) : (
                <>
                  <option value="baileys">@whiskeysockets/baileys (QR Code)</option>
                  <option value="whatsapp-web.js">whatsapp-web.js</option>
                  <option value="meta-cloud-api">Meta Official WhatsApp Cloud API</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] font-mono block mb-1.5">Bot Purpose</label>
            <input
              type="text"
              value={customBotType}
              onChange={(e) => setCustomBotType(e.target.value)}
              placeholder="e.g. Real Estate Lead Qualifier"
              className="w-full bg-[#0D0D0D] border border-[#222222] rounded p-2 text-xs text-white focus:border-[#444444] font-mono"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] font-mono block mb-1.5">
            Custom Capabilities & Integrations
          </label>
          <textarea
            value={customRequirements}
            onChange={(e) => setCustomRequirements(e.target.value)}
            rows={2}
            className="w-full bg-[#0D0D0D] border border-[#222222] rounded p-2 text-xs text-[#E0E0E0] focus:border-[#444444] font-mono"
            placeholder="e.g. Integrate PostgreSQL database query tool, support voice notes audio summary, add rate limiter..."
          />
        </div>

        <button
          onClick={handleGenerateCustom}
          disabled={isGeneratingCustom}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-semibold rounded shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGeneratingCustom ? 'Generating Tailored Code...' : 'GENERATE_TAILORED_BOT_CODE'}</span>
        </button>
      </div>
    </div>
  );
};
