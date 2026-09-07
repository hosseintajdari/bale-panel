import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Send,
  Smartphone,
  Server,
  Cloud,
  FileImage,
  Mic,
  Workflow,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<'telegram' | 'whatsapp-qr' | 'whatsapp-cloud' | 'multimodal'>('telegram');

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-mono font-bold">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Bot Architecture & Execution Flow
            </h2>
            <p className="text-xs text-[#888888]">
              How incoming messages flow from Telegram & WhatsApp clients through your Node.js server into Gemini and back.
            </p>
          </div>
        </div>

        {/* Pipeline Tab Switcher */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#222222] text-xs font-mono">
          <button
            onClick={() => setSelectedFlow('telegram')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-2 transition-all cursor-pointer ${
              selectedFlow === 'telegram'
                ? 'bg-[#24A1DE]/20 text-[#24A1DE] border border-[#24A1DE]/40 shadow-sm'
                : 'bg-[#161616] text-[#888888] border border-[#222222] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-[#24A1DE]" />
            <span>Telegram (Telegraf / Polling)</span>
          </button>

          <button
            onClick={() => setSelectedFlow('whatsapp-qr')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-2 transition-all cursor-pointer ${
              selectedFlow === 'whatsapp-qr'
                ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 shadow-sm'
                : 'bg-[#161616] text-[#888888] border border-[#222222] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp (Baileys QR Sync)</span>
          </button>

          <button
            onClick={() => setSelectedFlow('whatsapp-cloud')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-2 transition-all cursor-pointer ${
              selectedFlow === 'whatsapp-cloud'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                : 'bg-[#161616] text-[#888888] border border-[#222222] hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Meta WhatsApp Cloud API</span>
          </button>

          <button
            onClick={() => setSelectedFlow('multimodal')}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-2 transition-all cursor-pointer ${
              selectedFlow === 'multimodal'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'bg-[#161616] text-[#888888] border border-[#222222] hover:text-white'
            }`}
          >
            <FileImage className="w-3.5 h-3.5 text-purple-400" />
            <span>Multimodal (Photos & Audio)</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Interactive Diagram */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 relative overflow-hidden">
        <h3 className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] font-mono mb-5 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          INTERACTIVE_PIPELINE_FLOW
        </h3>

        {selectedFlow === 'telegram' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-[#24A1DE] uppercase font-bold mb-1">STEP 1: INGRESS</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Send className="w-3.5 h-3.5 text-[#24A1DE]" />
                Telegram Client
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                User types a message or sends a photo to your bot in Telegram client.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                ctx.message.text
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-bold mb-1">STEP 2: SERVER</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Node.js (Telegraf)
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Fetches user context from <code className="text-sky-400 font-mono">chatId</code> session cache and triggers <code className="text-sky-400 font-mono">sendChatAction("typing")</code>.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                sessions.get(ctx.chat.id)
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">STEP 3: REASONING</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Google Gemini API
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Executes multi-turn reasoning with <code className="text-purple-400 font-mono">gemini-3.7-flash</code>, tool invocation, or image analysis.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] border border-purple-500/30 p-1.5 rounded text-purple-300 font-mono">
                ai.models.generateContent()
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">STEP 4: EGRESS</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Telegram Delivery
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Saves exchange to memory history and replies to Telegram with Markdown formatting.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                ctx.reply(response.text)
              </div>
            </div>
          </div>
        )}

        {selectedFlow === 'whatsapp-qr' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-[#25D366] uppercase font-bold mb-1">STEP 1: AUTH</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                QR Code Pairing
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Scan terminal QR code once using WhatsApp Mobile App &gt; Linked Devices.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                useMultiFileAuthState()
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">STEP 2: LISTENER</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Baileys Socket
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Receives <code className="text-emerald-400 font-mono">messages.upsert</code>, verifies <code className="text-emerald-400 font-mono">!fromMe</code>, and isolates context per phone JID.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                sock.ev.on("messages.upsert")
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">STEP 3: AI INFERENCE</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini 3.7 Flash
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Passes phone history context and prompts Gemini for a mobile-concise WhatsApp styled response.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] border border-purple-500/30 p-1.5 rounded text-purple-300 font-mono">
                ai.models.generateContent()
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">STEP 4: DISPATCH</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp Message
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Sends reply directly to sender's WhatsApp chat with typing simulation.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                sock.sendMessage(jid, text)
              </div>
            </div>
          </div>
        )}

        {selectedFlow === 'whatsapp-cloud' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-bold mb-1">STEP 1: META INGRESS</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                Meta Graph API
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Customer chats with registered WhatsApp Business Phone number. Meta fires HTTP POST to your webhook.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                POST /webhook (Graph v21.0)
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-sky-400 uppercase font-bold mb-1">STEP 2: EXPRESS</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Webhook Ingestion
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Express responds with HTTP 200 immediately, verifies HMAC signature, and parses sender payload.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                res.sendStatus(200)
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">STEP 3: GEMINI BRAIN</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini AI Engine
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Generates tailored answer, executes enterprise CRM/inventory tools if requested.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] border border-purple-500/30 p-1.5 rounded text-purple-300 font-mono">
                ai.models.generateContent()
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">STEP 4: EGRESS</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp Delivery
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Sends HTTP POST to Meta's messages endpoint with Bearer token authentication.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                POST /messages (Bearer)
              </div>
            </div>
          </div>
        )}

        {selectedFlow === 'multimodal' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">STEP 1: MEDIA</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <FileImage className="w-3.5 h-3.5 text-purple-400" />
                Photo or Audio
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                User sends an image (receipt, chart, screenshot) or voice note (.ogg/.opus) via Telegram or WhatsApp.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-blue-400 uppercase font-bold mb-1">STEP 2: BUFFER</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Base64 Conversion
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Node.js downloads the file stream into a buffer and converts to base64 string with appropriate MIME type.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] p-1.5 rounded text-[#AAAAAA] font-mono border border-[#222222]">
                Buffer.toString("base64")
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">STEP 3: MULTIMODAL</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini Vision / Audio
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Gemini natively inspects image pixels or transcribes/understands voice audio without third-party OCR or STT.
              </p>
              <div className="mt-3 text-[10px] bg-[#0D0D0D] border border-purple-500/30 p-1.5 rounded text-purple-300 font-mono">
                inlineData: &#123; mimeType, data &#125;
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] p-4 rounded-lg relative">
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">STEP 4: ANSWER</div>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Structured Reply
              </h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Bot replies with image summary, receipt calculation, or voice note transcription and answer.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Memory & Session Management Deep-Dive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="w-7 h-7 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-white mb-1.5 font-mono uppercase tracking-wider">SESSION_MEMORY</h3>
          <p className="text-xs text-[#888888] leading-relaxed mb-3">
            Map each user’s unique <code className="text-sky-400 font-mono">chatId</code> (Telegram) or <code className="text-emerald-400 font-mono">remoteJid</code> (WhatsApp) to their message history.
          </p>
          <ul className="space-y-1.5 text-xs font-mono text-[#777777]">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span><strong>Dev:</strong> In-memory <code className="text-[#AAAAAA]">new Map&lt;string, History[]&gt;()</code></span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span><strong>Prod:</strong> Redis with TTL (e.g. 24h expiration)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">✓</span>
              <span><strong>Cap History:</strong> Limit to last 10–12 exchanges for sub-second responses</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-white mb-1.5 font-mono uppercase tracking-wider">LATENCY_&_MODELS</h3>
          <p className="text-xs text-[#888888] leading-relaxed mb-3">
            Messaging apps demand sub-second latency for natural user conversations.
          </p>
          <ul className="space-y-1.5 text-xs font-mono text-[#777777]">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400">⚡</span>
              <span><strong>Speed:</strong> <code className="text-purple-400">gemini-3.7-flash</code> (Fast, low-latency)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-400">🧠</span>
              <span><strong>Complex:</strong> <code className="text-purple-400">gemini-3.1-pro-preview</code> (STEM/Code)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">💬</span>
              <span>Always trigger "typing..." action for immediate user feedback</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-white mb-1.5 font-mono uppercase tracking-wider">SECURITY_&_KEYS</h3>
          <p className="text-xs text-[#888888] leading-relaxed mb-3">
            Essential production guards when operating live bots:
          </p>
          <ul className="space-y-1.5 text-xs font-mono text-[#777777]">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">🔒</span>
              <span>Keep <code className="text-[#AAAAAA]">GEMINI_API_KEY</code> and Bot Tokens strictly in server environment</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">🛡️</span>
              <span>Rate limit per user to avoid spam loops</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400">🧹</span>
              <span>Provide <code className="text-sky-400">/reset</code> command for GDPR/privacy compliance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
