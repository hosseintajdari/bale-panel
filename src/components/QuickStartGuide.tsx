import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Send,
  Smartphone,
  ExternalLink,
  Sparkles,
  Key,
  FolderPlus,
  Play,
  ArrowRight
} from 'lucide-react';

export const QuickStartGuide: React.FC = () => {
  const [platform, setPlatform] = useState<'telegram' | 'whatsapp'>('telegram');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-mono font-medium">
                5-MIN QUICKSTART
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-2">
              From Zero to Live Gemini Bot in 4 Steps
            </h2>
            <p className="text-xs text-[#888888] mt-1">
              Follow this step-by-step checklist to deploy your Node.js bot locally or to any cloud host.
            </p>
          </div>

          {/* Platform Tab Filter */}
          <div className="flex bg-[#141414] p-1 rounded-lg border border-[#222222] text-xs font-mono">
            <button
              onClick={() => setPlatform('telegram')}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                platform === 'telegram'
                  ? 'bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/40 shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#24A1DE]" />
              <span>Telegram Guide</span>
            </button>
            <button
              onClick={() => setPlatform('whatsapp')}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                platform === 'whatsapp'
                  ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="space-y-3">
        {/* Step 1 */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 relative">
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
              01
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1 font-mono">
                {platform === 'telegram'
                  ? 'Obtain Telegram Bot Token via @BotFather'
                  : 'Prepare WhatsApp Credentials'}
              </h3>
              <p className="text-xs text-[#888888] mb-3 leading-relaxed">
                {platform === 'telegram' ? (
                  <>
                    Open Telegram and search for <strong className="text-white">@BotFather</strong>. Send <code className="text-[#24A1DE] bg-[#161616] px-1 py-0.5 rounded font-mono text-xs border border-[#222222]">/newbot</code>, choose a display name and username ending in <code className="text-[#24A1DE] font-mono">bot</code>, and copy your HTTP API token.
                  </>
                ) : (
                  <>
                    For <strong className="text-white">Baileys (Recommended for quick testing)</strong>, you only need an active WhatsApp phone to scan the terminal QR code. For <strong className="text-white">Meta Cloud API</strong>, register a Meta Developer App and grab your System User Token & Phone Number ID.
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 bg-[#161616] text-[#888888] rounded border border-[#222222]">
                  {platform === 'telegram'
                    ? 'TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNO..."'
                    : 'WHATSAPP_TOKEN="EAAX... (Meta) or Scan QR via Baileys"'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 relative">
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
              02
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1 font-mono">
                Initialize Node.js Project & Install SDK
              </h3>
              <p className="text-xs text-[#888888] mb-3 leading-relaxed">
                Create a new project directory and install the official <code className="text-purple-400 bg-[#161616] px-1 py-0.5 rounded font-mono text-xs border border-[#222222]">@google/genai</code> SDK and bot driver.
              </p>

              <div className="bg-[#0D0D0D] border border-[#222222] rounded-lg p-3 flex items-center justify-between font-mono text-xs text-[#E0E0E0]">
                <code>
                  {platform === 'telegram'
                    ? 'npm init -y && npm install @google/genai telegraf dotenv tsx'
                    : 'npm init -y && npm install @google/genai @whiskeysockets/baileys qrcode-terminal dotenv tsx'}
                </code>
                <button
                  onClick={() =>
                    handleCopy(
                      platform === 'telegram'
                        ? 'npm init -y && npm install @google/genai telegraf dotenv tsx'
                        : 'npm init -y && npm install @google/genai @whiskeysockets/baileys qrcode-terminal dotenv tsx',
                      2
                    )
                  }
                  className="p-1.5 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition-colors cursor-pointer"
                  title="Copy command"
                >
                  {copiedStep === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 relative">
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
              03
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1 font-mono">
                Create <code className="text-purple-400">.env</code> Configuration
              </h3>
              <p className="text-xs text-[#888888] mb-3 leading-relaxed">
                Store your Gemini API key and bot token securely in a <code className="text-[#AAAAAA] font-mono text-xs">.env</code> file in your project root.
              </p>

              <div className="bg-[#0D0D0D] border border-[#222222] rounded-lg p-3 flex items-center justify-between font-mono text-xs text-[#E0E0E0]">
                <pre className="text-xs leading-relaxed">
                  {platform === 'telegram'
                    ? `GEMINI_API_KEY="your_api_key_from_ai_studio"\nTELEGRAM_BOT_TOKEN="your_token_from_botfather"\nGEMINI_MODEL="gemini-3.7-flash"`
                    : `GEMINI_API_KEY="your_api_key_from_ai_studio"\nGEMINI_MODEL="gemini-3.7-flash"`}
                </pre>
                <button
                  onClick={() =>
                    handleCopy(
                      platform === 'telegram'
                        ? `GEMINI_API_KEY="your_api_key"\nTELEGRAM_BOT_TOKEN="your_token"\nGEMINI_MODEL="gemini-3.7-flash"`
                        : `GEMINI_API_KEY="your_api_key"\nGEMINI_MODEL="gemini-3.7-flash"`,
                      3
                    )
                  }
                  className="p-1.5 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition-colors cursor-pointer"
                  title="Copy .env template"
                >
                  {copiedStep === 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 relative">
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
              04
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1 font-mono">
                Launch Bot & Start Chatting
              </h3>
              <p className="text-xs text-[#888888] mb-3 leading-relaxed">
                Run the bot script with <code className="text-emerald-400 bg-[#161616] px-1 py-0.5 rounded font-mono text-xs border border-[#222222]">npx tsx bot.ts</code>. Open your chat client and send a message!
              </p>

              <div className="bg-[#0D0D0D] border border-[#222222] rounded-lg p-3 flex items-center justify-between font-mono text-xs text-emerald-400">
                <code>npx tsx {platform === 'telegram' ? 'telegram-bot.ts' : 'whatsapp-bot.ts'}</code>
                <button
                  onClick={() =>
                    handleCopy(
                      `npx tsx ${platform === 'telegram' ? 'telegram-bot.ts' : 'whatsapp-bot.ts'}`,
                      4
                    )
                  }
                  className="p-1.5 hover:bg-[#1A1A1A] rounded text-[#888888] hover:text-white transition-colors cursor-pointer"
                  title="Copy command"
                >
                  {copiedStep === 4 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
