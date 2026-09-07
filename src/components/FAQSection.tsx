import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageCircle, FileImage, Mic, Database, ShieldAlert } from 'lucide-react';

interface FAQItem {
  question: string;
  category: string;
  icon: any;
  answer: string;
  codeSnippet?: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Can Gemini analyze photos and screenshots sent to Telegram or WhatsApp?',
    category: 'Multimodal Vision',
    icon: FileImage,
    answer:
      'Yes! Gemini models (like gemini-3.7-flash) natively accept images as inline base64 parts. In Node.js, download the photo buffer from Telegram or WhatsApp, convert it to base64, and pass it under the `inlineData` part in `ai.models.generateContent()`.',
    codeSnippet: `const response = await ai.models.generateContent({
  model: "gemini-3.7-flash",
  contents: {
    parts: [
      { inlineData: { mimeType: "image/jpeg", data: base64Buffer } },
      { text: caption || "Describe this image." }
    ]
  }
});`,
  },
  {
    question: 'Can Gemini process and transcribe voice notes / audio messages?',
    category: 'Audio & Speech',
    icon: Mic,
    answer:
      'Yes! Gemini 3.7 Flash supports audio multimodal input natively. You can pass raw audio data (e.g. OGG, MP3, WAV) directly in `inlineData: { mimeType: "audio/ogg", data: base64Audio }` to get instant transcription, translations, or direct conversational answers.',
    codeSnippet: `const response = await ai.models.generateContent({
  model: "gemini-3.7-flash",
  contents: {
    parts: [
      { inlineData: { mimeType: "audio/ogg", data: audioBase64 } },
      { text: "Transcribe this voice note and answer any questions asked in it." }
    ]
  }
});`,
  },
  {
    question: 'How do I keep multi-turn conversation memory separated for each user?',
    category: 'Session State',
    icon: Database,
    answer:
      'In messaging bots, each user has a unique identifier: `ctx.chat.id` in Telegram, and `remoteJid` (e.g. `1234567890@s.whatsapp.net`) in WhatsApp. Store an array of previous `{ role: "user" | "model", parts: [...] }` entries mapped to that identifier in a `Map<string, History[]>` or a Redis cache with a TTL (e.g. 24 hours). Always slice history to the last 10–12 exchanges to keep latency minimal.',
  },
  {
    question: 'What is the best Gemini model for messaging bots?',
    category: 'Model Selection',
    icon: Sparkles,
    answer:
      'We recommend `gemini-3.7-flash` as the default choice. It offers lightning-fast responses (essential for chat apps), multimodal support (text, photos, audio), and an enormous context window at very low token cost. For highly specialized coding or deep STEM problem solving, you can route specific queries to `gemini-3.1-pro-preview`.',
  },
  {
    question: 'How can I stream Gemini responses in Telegram or WhatsApp?',
    category: 'Streaming',
    icon: MessageCircle,
    answer:
      'In Telegram, you can use `ai.models.generateContentStream()` and periodically edit the message with `ctx.telegram.editMessageText()` every 800ms–1000ms. In WhatsApp, streaming edits are not natively supported, so it is best to show the "typing..." presence indicator (`sock.sendPresenceUpdate("composing")`) while generating, and send the final message once complete.',
  },
  {
    question: 'How do I prevent rate limiting and high API costs on active group chats?',
    category: 'Production & Guardrails',
    icon: ShieldAlert,
    answer:
      '1. In group chats, only respond when the bot is explicitly mentioned (e.g. `@MyBotName` or command prefix `!ai`).\n2. Implement a simple in-memory token bucket rate limiter (e.g., max 15 requests per minute per user).\n3. Use `systemInstruction` to instruct Gemini to be concise and mobile-friendly, avoiding unnecessarily long answers.',
  },
];

export const FAQSection: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-mono font-bold">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Frequently Asked Questions & Expert Tips
          </h2>
          <p className="text-xs text-[#888888]">
            Key implementation details for running Gemini bots in production Node.js environments.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {FAQS.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          const Icon = faq.icon;

          return (
            <div
              key={idx}
              className={`border rounded-lg transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-[#161616] border-[#333333]'
                  : 'bg-[#141414] border-[#222222] hover:border-[#2E2E2E]'
              }`}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center text-blue-400 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 block font-mono tracking-wider">
                      {faq.category}
                    </span>
                    <h3 className="font-semibold text-xs text-white mt-0.5">{faq.question}</h3>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#888888] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#666666] shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[#222222] text-xs text-[#888888] space-y-3">
                  <p className="leading-relaxed whitespace-pre-line text-[#999999]">{faq.answer}</p>
                  {faq.codeSnippet && (
                    <pre className="p-3 bg-[#0D0D0D] rounded-lg font-mono text-xs text-[#E0E0E0] overflow-x-auto border border-[#222222] leading-relaxed">
                      <code>{faq.codeSnippet}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
