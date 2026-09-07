import React, { useState } from 'react';
import {
  Cpu,
  Server,
  Zap,
  CheckCircle2,
  Copy,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  Bot,
  MessageSquare,
  FileCode2,
  ExternalLink,
  Code2,
  Database,
  Globe,
  Radio,
  Sliders,
  Check,
  ChevronRight,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface McpTool {
  id: string;
  name: string;
  server: string;
  category: 'database' | 'workspace' | 'github' | 'browser' | 'crm' | 'filesystem';
  description: string;
  icon: string;
  status: 'connected' | 'available';
  schemaSnippet: string;
  sampleCall: string;
}

const MCP_TOOLS: McpTool[] = [
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL & pgvector MCP',
    server: '@modelcontextprotocol/server-postgres',
    category: 'database',
    description: 'Execute read/write queries, semantic vector similarity searches, and manage schema migrations via standard MCP protocol.',
    icon: '🐘',
    status: 'connected',
    schemaSnippet: `{
  "name": "query_database",
  "description": "Execute parameterized SQL or pgvector cosine similarity search",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "params": { "type": "array" }
    },
    "required": ["query"]
  }
}`,
    sampleCall: `// Agent invokes PostgreSQL via MCP:
const results = await mcpClient.callTool({
  name: "query_database",
  arguments: {
    query: "SELECT id, title, content FROM user_notes WHERE embedding <=> $1 < 0.25 LIMIT 5",
    params: [userEmbedding]
  }
});`
  },
  {
    id: 'mcp-google-workspace',
    name: 'Google Workspace & Drive MCP',
    server: '@modelcontextprotocol/server-gdrive',
    category: 'workspace',
    description: 'Search Docs, sync Google Sheets rows, append calendar events, and read emails on behalf of the bot user.',
    icon: '📁',
    status: 'connected',
    schemaSnippet: `{
  "name": "append_spreadsheet_row",
  "description": "Appends a new record or task to a specified Google Sheet",
  "inputSchema": {
    "type": "object",
    "properties": {
      "spreadsheetId": { "type": "string" },
      "range": { "type": "string" },
      "values": { "type": "array" }
    },
    "required": ["spreadsheetId", "values"]
  }
}`,
    sampleCall: `// Agent appends meeting action item to Google Sheets:
await mcpClient.callTool({
  name: "append_spreadsheet_row",
  arguments: {
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    range: "Tasks!A:E",
    values: [["2026-08-15", "Sarah", "Fix Webhook ECONNRESET", "High", "Pending"]]
  }
});`
  },
  {
    id: 'mcp-github',
    name: 'GitHub & GitLab MCP',
    server: '@modelcontextprotocol/server-github',
    category: 'github',
    description: 'Create issues, review pull requests, trigger CI/CD actions, and search repository code directly from Telegram/WhatsApp.',
    icon: '🐙',
    status: 'connected',
    schemaSnippet: `{
  "name": "create_github_issue",
  "description": "Opens a bug or task issue in a target GitHub repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "owner": { "type": "string" },
      "repo": { "type": "string" },
      "title": { "type": "string" },
      "body": { "type": "string" },
      "labels": { "type": "array" }
    },
    "required": ["owner", "repo", "title"]
  }
}`,
    sampleCall: `// Agent converts user note into GitHub Issue:
await mcpClient.callTool({
  name: "create_github_issue",
  arguments: {
    owner: "company",
    repo: "telegram-gemini-bot",
    title: "Implement MCP tool fallback for SQLite",
    labels: ["enhancement", "mcp"]
  }
});`
  },
  {
    id: 'mcp-brave-search',
    name: 'Brave Search & Live Web MCP',
    server: '@modelcontextprotocol/server-brave-search',
    category: 'browser',
    description: 'Ground Gemini answers with live web search results, current prices, real-time documentation, and news.',
    icon: '🌐',
    status: 'available',
    schemaSnippet: `{
  "name": "brave_web_search",
  "description": "Execute live web searches with real-time freshness",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "count": { "type": "number", "default": 5 }
    },
    "required": ["query"]
  }
}`,
    sampleCall: `// Agent executes live web grounding:
const searchData = await mcpClient.callTool({
  name: "brave_web_search",
  arguments: { query: "Gemini 3.7 Flash SDK tool calling examples", count: 3 }
});`
  },
  {
    id: 'mcp-slack-telegram',
    name: 'Omni-Channel Messenger MCP',
    server: '@modelcontextprotocol/server-messages',
    category: 'crm',
    description: 'Cross-broadcast messages, sync conversation threads, and send interactive WhatsApp CTA buttons or Telegram inline keyboards.',
    icon: '💬',
    status: 'available',
    schemaSnippet: `{
  "name": "send_interactive_message",
  "description": "Sends interactive button menus or cards to Telegram or WhatsApp",
  "inputSchema": {
    "type": "object",
    "properties": {
      "platform": { "type": "string", "enum": ["telegram", "whatsapp"] },
      "recipientId": { "type": "string" },
      "text": { "type": "string" },
      "buttons": { "type": "array" }
    },
    "required": ["platform", "recipientId", "text"]
  }
}`,
    sampleCall: `// Agent triggers interactive menu:
await mcpClient.callTool({
  name: "send_interactive_message",
  arguments: {
    platform: "whatsapp",
    recipientId: "+14155552671",
    text: "Please select an action for note #104:",
    buttons: [{ id: "btn_save", title: "💾 Save to DB" }, { id: "btn_gh", title: "🐙 Push to GitHub" }]
  }
});`
  }
];

export const McpAndWhatsAppGuide: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<McpTool>(MCP_TOOLS[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'mcp' | 'whatsapp_guide' | 'architecture'>('mcp');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const mcpServerCode = `// mcp-bot-server.ts
// Production TypeScript Agent with Model Context Protocol (MCP) + Gemini 3.7 + Telegram/WhatsApp

import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import TelegramBot from "node-telegram-bot-api";

// 1. Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// 2. Initialize MCP Client (Connect to Postgres, GitHub, Workspace MCP Servers)
const mcpTransport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-postgres", process.env.DATABASE_URL!]
});

const mcpClient = new Client({ name: "telegram-gemini-mcp-agent", version: "1.0.0" }, {
  capabilities: { tools: {} }
});

async function bootstrap() {
  await mcpClient.connect(mcpTransport);
  console.log("⚡ MCP Client successfully connected to tool server!");

  // List available tools from MCP server
  const { tools } = await mcpClient.listTools();
  console.log(\`📦 Loaded \${tools.length} MCP Tools for Gemini\`);

  // Transform MCP Tool Schemas into Gemini Function Declarations
  const geminiTools = [{
    functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema
    }))
  }];

  // Handle incoming Telegram messages
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const chatId = msg.chat.id;

    try {
      await bot.sendChatAction(chatId, "typing");

      // Send to Gemini with full MCP Tool Declarations
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: msg.text,
        config: {
          systemInstruction: "You are an autonomous AI assistant empowered with MCP tools (Database, GitHub, Workspace). Always call appropriate tools when the user requests data or action.",
          tools: geminiTools
        }
      });

      // Handle Model Tool Call (Function Execution via MCP)
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          await bot.sendMessage(chatId, \`🔧 Executing MCP Tool: \`\`\${call.name}\`\`...\`, { parse_mode: "Markdown" });
          
          // Execute on MCP Server
          const toolResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args as Record<string, unknown>
          });

          // Feed back tool output to Gemini for final synthesis
          const finalAnswer = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: [
              { role: "user", parts: [{ text: msg.text }] },
              { role: "model", parts: [{ functionCall: call }] },
              { role: "user", parts: [{ functionResponse: { name: call.name, response: toolResult } }] }
            ]
          });

          await bot.sendMessage(chatId, finalAnswer.text || "Tool executed successfully.");
          return;
        }
      }

      await bot.sendMessage(chatId, response.text || "No response generated.");
    } catch (err: any) {
      console.error("Agent error:", err);
      await bot.sendMessage(chatId, \`⚠️ Error: \${err.message}\`);
    }
  });
}

bootstrap();`;

  const whatsAppComparisonCode = `// whatsapp-baileys-or-cloudapi.ts
// Two methods to run a Gemini AI Bot on WhatsApp:

// ==========================================
// METHOD A: Official Meta WhatsApp Cloud API (Free 1,000 conversations/mo)
// Supports: Interactive Buttons, List Menus, Template Messages, Webhooks
// ==========================================

import axios from "axios";

export async function sendWhatsAppInteractiveButtons(to: string, text: string) {
  const url = \`https://graph.facebook.com/v19.0/\${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages\`;
  
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to, // e.g. "989123456789"
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: text },
        action: {
          buttons: [
            { type: "reply", reply: { id: "opt_summary", title: "📝 Summary" } },
            { type: "reply", reply: { id: "opt_tasks", title: "✅ Action Items" } },
            { type: "reply", reply: { id: "opt_github", title: "🐙 Push to GH" } }
          ]
        }
      }
    },
    { headers: { Authorization: \`Bearer \${process.env.WHATSAPP_ACCESS_TOKEN}\` } }
  );
}

// ==========================================
// METHOD B: Open-Source Socket Bridge (Baileys / whatsapp-web.js)
// Runs on your own phone number via QR Code login (Self-hosted)
// ==========================================
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startWhatsAppQRBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const userText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!userText) return;

    const reply = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userText
    });

    await sock.sendMessage(msg.key.remoteJid!, { text: reply.text || "Hello!" });
  });
}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-bl from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Model Context Protocol (MCP) & WhatsApp Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Anthropic Open Standard + Gemini 3.7
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              MCP Tools Integration & WhatsApp Bot Architecture
            </h2>
            <p className="text-sm text-[#999999] max-w-3xl leading-relaxed">
              Connect your Telegram & WhatsApp bots to hundreds of external tools (Postgres, GitHub, Google Drive, Brave Search) using standard MCP, plus a complete breakdown of why WhatsApp behaves differently from Telegram.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-1.5 bg-[#0A0A0A] border border-[#222222] p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveSubTab('mcp')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                activeSubTab === 'mcp'
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              🛠️ MCP Tools Hub
            </button>
            <button
              onClick={() => setActiveSubTab('whatsapp_guide')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                activeSubTab === 'whatsapp_guide'
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              📱 WhatsApp vs Telegram
            </button>
            <button
              onClick={() => setActiveSubTab('architecture')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                activeSubTab === 'architecture'
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              💻 Code & Setup
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: MCP TOOLS HUB */}
      {activeSubTab === 'mcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tool Selection List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#222222]">
              <span className="text-xs font-mono uppercase text-[#888888]">
                Available MCP Server Connectors ({MCP_TOOLS.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                ● Model Context Protocol v1.0
              </span>
            </div>

            <div className="space-y-2">
              {MCP_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex items-start space-x-3 ${
                    selectedTool.id === tool.id
                      ? 'bg-[#181818] border-blue-500/50 shadow-md ring-1 ring-blue-500/20'
                      : 'bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414]'
                  }`}
                >
                  <span className="text-2xl p-1 bg-[#0A0A0A] rounded border border-[#262626] shrink-0">
                    {tool.icon}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white truncate font-mono">
                        {tool.name}
                      </h4>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        tool.status === 'connected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="text-[10px] font-mono text-blue-400 truncate">
                      {tool.server}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* MCP Explainer Box */}
            <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-lg space-y-2 text-xs text-[#888888]">
              <div className="flex items-center space-x-1.5 text-white font-mono text-xs font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>How MCP Works with Gemini 3.7:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                MCP exposes standardized JSON-RPC endpoints for local and cloud tools. When a Telegram/WhatsApp user sends a message, Gemini inspects the available MCP tool schemas and automatically calls the right server.
              </p>
            </div>
          </div>

          {/* Right Column: Selected Tool Detail & Live JSON Schema */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl p-1.5 bg-[#0A0A0A] rounded-lg border border-[#262626]">
                    {selectedTool.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white font-mono">
                      {selectedTool.name}
                    </h3>
                    <p className="text-xs text-blue-400 font-mono">
                      {selectedTool.server}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(selectedTool.sampleCall, `call-${selectedTool.id}`)}
                  className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-[#252525] text-xs font-mono text-[#CCCCCC] border border-[#333333] flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedCode === `call-${selectedTool.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Invocation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tool Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#666666]">Capabilities Overview:</span>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>

              {/* MCP Tool Input Schema */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#888888] flex items-center gap-1">
                    <FileCode2 className="w-3 h-3 text-purple-400" />
                    MCP Tool JSON Schema (Exposed to Gemini)
                  </span>
                </div>
                <pre className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-3 text-[11px] font-mono text-purple-300 overflow-x-auto">
                  {selectedTool.schemaSnippet}
                </pre>
              </div>

              {/* Sample Code Execution Call */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#888888] flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  Agent Execution Flow (Node.js SDK)
                </span>
                <pre className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {selectedTool.sampleCall}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WHATSAPP VS TELEGRAM IN-DEPTH COMPARISON */}
      {activeSubTab === 'whatsapp_guide' && (
        <div className="space-y-6">
          {/* Direct Answer Banner for WhatsApp */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg shrink-0 text-emerald-400">
                📱
              </span>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">
                  پاسخ کامل: تفاوت ساختاری واتساپ و تلگرام برای ربات‌های هوش مصنوعی
                </h3>
                <p className="text-xs text-[#BBBBBB] leading-relaxed">
                  تلگرام دارای یک پلتفرم رسمی به نام **Bot API** است که ساختن بات در آن با یک پیام به <code className="text-blue-300">@BotFather</code> و در عرض ۳۰ ثانیه انجام می‌شود و دارای دکمه‌های شیشه‌ای (Inline Keyboard) و منوهای متنوع است.
                  اما در واتساپ دو مسیر کاملاً متفاوت وجود دارد:
                </p>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option 1: WhatsApp Cloud API */}
              <div className="bg-[#0D0D0D] border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    روش اول: WhatsApp Cloud API (رسمی متا)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/30">
                    رسمی & تجاری
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#999999]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>امکانات:</strong> پشتیبانی کامل از دکمه‌های تعاملی (Interactive Buttons)، منوی لیست و ارسال کارت محصولات.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>هزینه:</strong> ماهانه ۱,۰۰۰ مکالمه ورودی کاملاً <strong>رایگان</strong> از سمت متا.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">!</span>
                    <span><strong>پیش‌نیاز:</strong> نیاز به ثبت‌نام در پنل توسعه‌دهندگان Meta (developers.facebook.com) و تایید هویت بیزینس دارد.</span>
                  </li>
                </ul>
              </div>

              {/* Option 2: WhatsApp Web Socket Bridge */}
              <div className="bg-[#0D0D0D] border border-blue-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-blue-400" />
                    روش دوم: لایبرری‌های سوکت (Baileys / WA-Web)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded border border-blue-500/30">
                    سریع & شخصی
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#999999]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span><strong>نحوه اتصال:</strong> بدون نیاز به تایید بیزینس؛ با اسکن QR Code در ترمینال درست مثل WhatsApp Web وصل می‌شود.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span>
                    <span><strong>کاربرد:</strong> فوق‌العاده برای ربات دستیار شخصی روی شماره تلفن خودتان.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">!</span>
                    <span><strong>محدودیت منو:</strong> منوهای دکمه‌ای رسمی در این روش محدودتر هستند و ارتباط متکی به متن و دستورات متنی است.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* WhatsApp Interactive Code Snippet */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                کد آماده ارسال پیام با دکمه در واتساپ و اتصال مستقیم به Gemini 3.7
              </span>
              <button
                onClick={() => copyToClipboard(whatsAppComparisonCode, 'wa-code')}
                className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-[#252525] text-xs font-mono text-[#CCCCCC] border border-[#333333] flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedCode === 'wa-code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-4 text-[11px] font-mono text-[#E0E0E0] overflow-x-auto leading-relaxed max-h-96">
              {whatsAppComparisonCode}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPLETE MCP AGENT SERVER CODE */}
      {activeSubTab === 'architecture' && (
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Full Production Server: Telegram + Gemini 3.7 + MCP Tools</span>
              </h3>
              <p className="text-xs text-[#888888]">
                This self-contained Node.js server automatically translates MCP tool schemas into Gemini Function Declarations and executes them dynamically.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(mcpServerCode, 'mcp-server-full')}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-mono text-white flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all"
            >
              {copiedCode === 'mcp-server-full' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Server Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy TypeScript Server</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-4 text-[11px] font-mono text-[#CCCCCC] overflow-x-auto leading-relaxed max-h-[500px]">
            {mcpServerCode}
          </pre>

          {/* Quick Install Command */}
          <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="text-[#888888]">
              Install required MCP and Telegram dependencies:
            </span>
            <code className="bg-[#1A1A1A] px-2.5 py-1 rounded text-emerald-300 border border-[#333333]">
              npm install @google/genai @modelcontextprotocol/sdk node-telegram-bot-api
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
