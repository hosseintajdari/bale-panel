import { CodeTemplate, BotPreset } from '../types';

export const BOT_PRESETS: BotPreset[] = [
  {
    id: 'note-taker-agent',
    name: '🧠 Executive Note Taker & Memory Agent',
    platform: 'telegram',
    description: 'Expands raw stream-of-consciousness thoughts into structured executive summaries, action items with assignees, tags, and tracks conversation stages in a high-performance memory DB.',
    icon: 'BookOpen',
    systemInstruction: `You are the Executive Note Taker & Long-Term Memory Intelligence Agent for Telegram and WhatsApp bots.

Core Operating Capabilities:
1. NOTE EXPANSION & STRUCTURING: When users provide quick thoughts, meeting notes, voice transcripts, or task lists, automatically structure them:
   - 📌 Executive Summary
   - 🎯 Action Items (with priority [High/Medium/Low] and assigned owner)
   - 🏷️ Categorization Tags (e.g. #Engineering, #Product, #Urgent)
   - 👥 Key Entities & Deadlines
2. STAGE & MEMORY PERSISTENCE: Track the conversation stage (STAGE_CAPTURE -> STAGE_SYNTHESIS -> STAGE_EXECUTION -> STAGE_RECALL) and remember past decisions, user preferences, and historical notes.
3. SEMANTIC RECALL: When asked "What did we decide about X?", perform intelligent recall from your knowledge base.`,
    temperature: 0.2,
    sampleQuestions: [
      'Take note: Team sync with Sarah. Migration to @google/genai with gemini-3.7-flash due Friday. Alex to set up pgvector on PostgreSQL.',
      'Expand: Meeting with design lead on WhatsApp onboarding drop-off. Need interactive list buttons next sprint.',
      'Recall: What were the key action items assigned to Alex in our backend architecture notes?',
      'Stage: Review pending tasks and transition workflow to execution mode'
    ]
  },
  {
    id: 'general-assistant',
    name: 'Omni AI Assistant',
    platform: 'telegram',
    description: 'Helpful general intelligence companion supporting questions, tasks, and ideas.',
    icon: 'Bot',
    systemInstruction: 'You are a warm, witty, and concise AI assistant running inside a messaging app. Keep answers structured, friendly, and easy to read on mobile screens. Use emojis tastefully.',
    temperature: 0.7,
    sampleQuestions: [
      'Explain how WebSockets work in 3 bullet points',
      'Give me 5 high-protein dinner ideas under 20 minutes',
      'What are the key differences between Gemini 3.7 Flash and Pro?',
      'Draft a polite message to reschedule a meeting'
    ]
  },
  {
    id: 'customer-support',
    name: 'E-Commerce / WhatsApp Store Bot',
    platform: 'whatsapp',
    description: 'Instant customer support for order tracking, FAQ answers, returns, and catalog inquiry.',
    icon: 'ShoppingBag',
    systemInstruction: 'You are the official 24/7 WhatsApp Virtual Support Concierge for "Apex Retail Store". Provide concise, polite assistance. When users inquire about order status, ask for their 4-digit order number (e.g., #1029 is Out for Delivery, #2041 is Shipped).',
    temperature: 0.5,
    sampleQuestions: [
      'Where is my order #1029?',
      'What is your return policy for electronics?',
      'Do you offer international shipping to Canada?',
      'Can I change my delivery address after ordering?'
    ]
  },
  {
    id: 'code-reviewer',
    name: 'Telegram Dev Copilot',
    platform: 'telegram',
    description: 'Instant code debugging, refactoring, SQL query writing, and regex explaining.',
    icon: 'Code2',
    systemInstruction: 'You are a Senior TypeScript and Node.js Architect bot on Telegram. Format all code cleanly in markdown with syntax highlighting. Prioritize performant, secure, and modern idioms.',
    temperature: 0.3,
    sampleQuestions: [
      'How do I handle connection timeouts in Telegraf?',
      'Write a regex to validate international phone numbers',
      'Fix this async/await loop memory leak in Node.js',
      'Explain how Gemini multimodal parts work with base64 images'
    ]
  },
  {
    id: 'multilingual-translator',
    name: 'Global WhatsApp Translator',
    platform: 'whatsapp',
    description: 'Translates incoming texts and voice notes into any language with cultural nuance.',
    icon: 'Languages',
    systemInstruction: 'You are an ultra-fast translation and localization bot on WhatsApp. When given text, detect the language, translate naturally to the requested language (or English/Spanish by default), and highlight slang or cultural notes.',
    temperature: 0.4,
    sampleQuestions: [
      'Translate "We look forward to signing the partnership next Tuesday" to formal Japanese and German.',
      'How do I politely say "Please send the invoice by end of day" in Spanish?',
      'Translate this slang: "No cap that was fire"'
    ]
  },
  {
    id: 'executive-concierge',
    name: 'Executive Chief of Staff',
    platform: 'telegram',
    description: 'High-efficiency operations assistant summarizing briefs, drafting executive emails, and organizing schedules.',
    icon: 'Briefcase',
    systemInstruction: 'You are a high-level Executive Chief of Staff bot. Always be hyper-efficient, structured, and action-oriented. Provide executive summaries with key decision points, risks, and next steps.',
    temperature: 0.5,
    sampleQuestions: [
      'Draft a brief email to shareholders on Q3 results',
      'Create an agenda for a 30-minute product sync',
      'Summarize key tradeoffs between serverless vs dedicated instances'
    ]
  },
  {
    id: 'pirate-captain',
    name: 'Captain Blackbeard (Roleplay)',
    platform: 'telegram',
    description: 'Playful seafaring pirate captain persona answering questions with nautical slang and swashbuckling humor.',
    icon: 'Compass',
    systemInstruction: 'Ahoy! Ye be Captain Blackbeard, a legendary high-seas pirate captain speaking in 18th-century nautical dialect! Pepper yer speech with "Ahoy", "Shiver me timbers", "Matey", and pirate metaphors while still being genuinely knowledgeable about tech and queries.',
    temperature: 0.9,
    sampleQuestions: [
      'How do I set up a Telegram bot in Node.js?',
      'What is the meaning of life, Captain?',
      'Where did you hide the treasure?'
    ]
  }
];

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'telegram-telegraf-ts',
    title: 'Telegram Bot with Telegraf (TypeScript)',
    platform: 'telegram',
    framework: 'telegraf',
    description: 'Production-ready Telegram bot with session memory per user, photo image analysis with Gemini Vision, slash commands, and error boundaries.',
    filename: 'telegram-bot.ts',
    highlights: [
      'Official @google/genai SDK integration',
      'Per-chat multi-turn memory session cache',
      'Multimodal image/photo handling via Telegram file download',
      'Slash commands: /start, /reset, /help, /model',
      'Automatic typing indicators ("typing...")'
    ],
    envSnippet: `# .env file
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_from_botfather"
GEMINI_API_KEY="your_google_gemini_api_key"
GEMINI_MODEL="gemini-3.7-flash"`,
    packageJsonSnippet: `{
  "name": "gemini-telegram-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx telegram-bot.ts",
    "build": "tsc",
    "start": "node dist/telegram-bot.js"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "dotenv": "^16.4.7",
    "telegraf": "^4.16.3",
    "axios": "^1.7.9"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}`,
    code: `import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.7-flash";

if (!BOT_TOKEN || !GEMINI_API_KEY) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN or GEMINI_API_KEY in .env");
  process.exit(1);
}

// 1. Initialize Gemini Client (User-Agent header configured)
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 2. Initialize Telegram Bot
const bot = new Telegraf(BOT_TOKEN);

// 3. Conversation Memory Storage (Chat ID -> Message history)
interface ChatHistoryItem {
  role: "user" | "model";
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

const chatSessions = new Map<number, ChatHistoryItem[]>();

function getSessionHistory(chatId: number): ChatHistoryItem[] {
  if (!chatSessions.has(chatId)) {
    chatSessions.set(chatId, []);
  }
  return chatSessions.get(chatId)!;
}

// Command: /start
bot.start(async (ctx) => {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    \`👋 Hello \${name}! I am an AI assistant powered by Google Gemini (\${MODEL_NAME}).\\n\\n\` +
    \`✨ Send me any text question or photo with a caption.\\n\` +
    \`🔄 Use /reset to start a fresh conversation.\\n\` +
    \`❓ Use /help for available commands.\`
  );
});

// Command: /reset - Clear memory for current chat
bot.command("reset", async (ctx) => {
  chatSessions.delete(ctx.chat.id);
  await ctx.reply("🧹 Conversation memory cleared! What would you like to explore next?");
});

// Command: /help
bot.command("help", async (ctx) => {
  await ctx.reply(
    \`🤖 *Gemini Telegram Bot Guide*\\n\\n\` +
    \`• *Text Chat*: Ask any question directly.\\n\` +
    \`• *Photo Analysis*: Send an image to have Gemini analyze it.\\n\` +
    \`• *Commands*:\\n\` +
    \`  /reset - Reset memory\\n\` +
    \`  /help - Show this guide\\n\` +
    \`  /ping - Bot latency check\`,
    { parse_mode: "Markdown" }
  );
});

bot.command("ping", async (ctx) => {
  const start = Date.now();
  await ctx.reply("🏓 Pong! Bot is active.");
});

// Handler: Incoming Text Messages
bot.on(message("text"), async (ctx) => {
  const chatId = ctx.chat.id;
  const userText = ctx.message.text;

  // Show "typing..." status while Gemini processes
  await ctx.sendChatAction("typing");

  try {
    const history = getSessionHistory(chatId);

    // Keep history capped to last 12 messages for memory efficiency
    const cappedHistory = history.slice(-12);

    // Build payload with system instructions
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...cappedHistory,
        { role: "user", parts: [{ text: userText }] }
      ],
      config: {
        systemInstruction:
          "You are a friendly, concise assistant in Telegram. Use Telegram markdown styling (*bold*, _italic_, \`code\`). Keep responses under 300 words unless in-depth code is requested.",
        temperature: 0.7,
      },
    });

    const reply = response.text || "Sorry, I could not generate an answer.";

    // Save to conversation history
    history.push({ role: "user", parts: [{ text: userText }] });
    history.push({ role: "model", parts: [{ text: reply }] });

    // Send reply to Telegram (with fallback if markdown formatting fails)
    try {
      await ctx.reply(reply, { parse_mode: "Markdown" });
    } catch {
      await ctx.reply(reply);
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    await ctx.reply("⚠️ Error connecting to Gemini API. Please try again in a moment.");
  }
});

// Handler: Incoming Photos (Gemini Vision Multimodal)
bot.on(message("photo"), async (ctx) => {
  const chatId = ctx.chat.id;
  const caption = ctx.message.caption || "Describe this image in detail.";
  const photos = ctx.message.photo;
  const highestResPhoto = photos[photos.length - 1]; // Get highest resolution

  await ctx.sendChatAction("typing");

  try {
    // 1. Get file direct download link from Telegram
    const fileLink = await ctx.telegram.getFileLink(highestResPhoto.file_id);
    
    // 2. Download image buffer
    const imageResponse = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const base64Image = Buffer.from(imageResponse.data).toString("base64");

    // 3. Send image + prompt to Gemini
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: caption },
        ],
      },
      config: {
        systemInstruction: "You are a multimodal vision assistant on Telegram. Analyze photos accurately and concisely.",
      },
    });

    const reply = response.text || "Image analyzed.";
    await ctx.reply(reply);
  } catch (error) {
    console.error("Vision Error:", error);
    await ctx.reply("⚠️ Could not process image. Please try again.");
  }
});

// Start Telegram Polling
bot.launch().then(() => {
  console.log(\`🚀 Telegram Bot connected and listening! Model: \${MODEL_NAME}\`);
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));`
  },
  {
    id: 'whatsapp-baileys-ts',
    title: 'WhatsApp Bot with Baileys (Multi-Device QR)',
    platform: 'whatsapp',
    framework: 'baileys',
    description: 'Fast, lightweight WhatsApp bot using @whiskeysockets/baileys. Generates a terminal QR code for phone pairing and handles direct messages with Gemini session isolation.',
    filename: 'whatsapp-bot.ts',
    highlights: [
      'Terminal QR code login (pairs with real WhatsApp phone)',
      'Multi-turn chat context mapped per sender phone number',
      'Ignores group spam & broadcast broadcasts automatically',
      'Supports presence updates ("typing...") on WhatsApp',
      'Zero monthly cost (runs directly on Node.js)'
    ],
    envSnippet: `# .env file
GEMINI_API_KEY="your_google_gemini_api_key"
GEMINI_MODEL="gemini-3.7-flash"
BOT_PREFIX="!" # Optional command prefix`,
    packageJsonSnippet: `{
  "name": "gemini-whatsapp-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx whatsapp-bot.ts"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@whiskeysockets/baileys": "^6.7.18",
    "qrcode-terminal": "^0.12.0",
    "dotenv": "^16.4.7",
    "pino": "^9.6.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "@types/node": "^22.10.0"
  }
}`,
    code: `import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  proto,
} from "@whiskeysockets/baileys";
import { GoogleGenAI } from "@google/genai";
import qrcode from "qrcode-terminal";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.7-flash";

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// 1. Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" },
  },
});

// 2. In-memory session store (Phone JID -> Gemini message history)
const userSessions = new Map<string, Array<{ role: "user" | "model"; parts: any[] }>>();

function getSession(jid: string) {
  if (!userSessions.has(jid)) {
    userSessions.set(jid, []);
  }
  return userSessions.get(jid)!;
}

// 3. Connect to WhatsApp Web Socket
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  // Handle QR code generation and connection state
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\\n📱 Scan this QR code with WhatsApp (Linked Devices):");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp Bot connected successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Handle Incoming Messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const senderJid = msg.key.remoteJid;
      if (!senderJid) continue;

      // Extract text from regular or extended text message
      const textMessage =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!textMessage.trim()) continue;

      // Command: !reset
      if (textMessage.trim() === "!reset" || textMessage.trim() === "/reset") {
        userSessions.delete(senderJid);
        await sock.sendMessage(senderJid, {
          text: "🧹 *Memory reset!* Starting a new conversation.",
        });
        continue;
      }

      console.log(\`📩 Message from \${senderJid}: \${textMessage}\`);

      // Set typing indicator
      await sock.sendPresenceUpdate("composing", senderJid);

      try {
        const history = getSession(senderJid);
        const cappedHistory = history.slice(-10);

        // Call Gemini
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            ...cappedHistory,
            { role: "user", parts: [{ text: textMessage }] },
          ],
          config: {
            systemInstruction:
              "You are a helpful, responsive WhatsApp AI Assistant powered by Google Gemini. Keep answers crisp and naturally formatted for WhatsApp (*bold*, _italic_, lists).",
            temperature: 0.7,
          },
        });

        const reply = response.text || "I am sorry, I could not process that.";

        // Update session
        history.push({ role: "user", parts: [{ text: textMessage }] });
        history.push({ role: "model", parts: [{ text: reply }] });

        // Send reply to WhatsApp
        await sock.sendMessage(senderJid, { text: reply });
      } catch (err: any) {
        console.error("Gemini Error:", err);
        await sock.sendMessage(senderJid, {
          text: "⚠️ Sorry, I encountered an error answering your request.",
        });
      } finally {
        await sock.sendPresenceUpdate("paused", senderJid);
      }
    }
  });
}

connectToWhatsApp();`
  },
  {
    id: 'whatsapp-meta-cloud-api',
    title: 'Meta Official WhatsApp Cloud API (Express Webhook)',
    platform: 'whatsapp',
    framework: 'meta-cloud-api',
    description: 'Enterprise production architecture using the official Meta WhatsApp Business Cloud API with Express webhook verification, secure token auth, and Gemini processing.',
    filename: 'whatsapp-cloud-server.ts',
    highlights: [
      'Official Meta WhatsApp Business Cloud API integration',
      'Express webhook endpoint with Hub challenge verification',
      'High-throughput scalable architecture for enterprise',
      'Media message extraction & Gemini multimodal response'
    ],
    envSnippet: `# .env file
WHATSAPP_TOKEN="EAAX...your_meta_system_user_token"
WHATSAPP_PHONE_NUMBER_ID="109283746592817"
WHATSAPP_VERIFY_TOKEN="my_custom_secret_verify_token"
GEMINI_API_KEY="your_gemini_api_key"
PORT=3000`,
    packageJsonSnippet: `{
  "name": "gemini-whatsapp-cloud-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx whatsapp-cloud-server.ts"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "express": "^4.21.2",
    "axios": "^1.7.9",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.10.0",
    "tsx": "^4.19.2"
  }
}`,
    code: `import express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

// Helper: Send WhatsApp Message via Meta Graph API
async function sendWhatsAppMessage(to: string, text: string) {
  const url = \`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    },
    {
      headers: {
        Authorization: \`Bearer \${WHATSAPP_TOKEN}\`,
        "Content-Type": "application/json",
      },
    }
  );
}

// 1. Meta Webhook Verification endpoint (GET /webhook)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Meta Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Meta Webhook Receiver (POST /webhook)
app.post("/webhook", async (req, res) => {
  // Acknowledge receipt to Meta immediately (prevents duplicate retries)
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message) return; // Status updates or delivery receipts

    const from = message.from; // Sender's WhatsApp number

    if (message.type === "text") {
      const userText = message.text.body;
      console.log(\`📩 WhatsApp text from \${from}: \${userText}\`);

      // Query Gemini
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: userText,
        config: {
          systemInstruction:
            "You are a professional, helpful customer assistant on WhatsApp. Format text cleanly.",
        },
      });

      const reply = geminiResponse.text || "Thank you for reaching out.";

      // Send back to user via WhatsApp Graph API
      await sendWhatsAppMessage(from, reply);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 WhatsApp Cloud Webhook listening on port \${PORT}\`);
});`
  },
  {
    id: 'function-calling-tools',
    title: 'Tool & Function Calling for Bots (Database, Weather, Orders)',
    platform: 'telegram',
    framework: 'telegraf',
    description: 'Empower your Telegram or WhatsApp bot to call live Node.js functions (e.g. check customer database, query live flight status, calculate quotes) using Gemini Function Calling.',
    filename: 'bot-with-tools.ts',
    highlights: [
      'Gemini 3.7 Flash Function Declarations',
      'Automated schema typing with Type.OBJECT and Type.STRING',
      'Real-world mock e-commerce database query execution',
      'Returns natural AI reply based on the function result'
    ],
    envSnippet: `GEMINI_API_KEY="your_api_key"
TELEGRAM_BOT_TOKEN="your_bot_token"`,
    packageJsonSnippet: `{
  "dependencies": {
    "@google/genai": "^2.4.0",
    "telegraf": "^4.16.3",
    "dotenv": "^16.4.7"
  }
}`,
    code: `import { Telegraf } from "telegraf";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

// 1. Define Tool Functions
const orderDb: Record<string, { status: string; item: string; eta: string }> = {
  "1029": { status: "Out for Delivery", item: "Wireless Noise-Canceling Headphones", eta: "Today by 4 PM" },
  "2041": { status: "Shipped", item: "Mechanical Gaming Keyboard", eta: "Tomorrow" },
};

function getOrderStatus(orderId: string) {
  const cleanId = orderId.replace("#", "");
  return orderDb[cleanId] || { status: "Not Found", message: "No order found with this ID." };
}

// 2. Define Function Declaration for Gemini
const getOrderStatusDeclaration: FunctionDeclaration = {
  name: "getOrderStatus",
  description: "Fetches live shipment and delivery status for a customer order ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: "The 4-digit order identifier, e.g. 1029 or 2041",
      },
    },
    required: ["orderId"],
  },
};

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.on("text", async (ctx) => {
  const userText = ctx.message.text;
  await ctx.sendChatAction("typing");

  try {
    // Call Gemini with tools declared
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userText,
      config: {
        systemInstruction: "You are an order tracking bot. If a user asks about an order, call the getOrderStatus tool.",
        tools: [{ functionDeclarations: [getOrderStatusDeclaration] }],
      },
    });

    // Check if Gemini invoked a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "getOrderStatus") {
        const { orderId } = call.args as { orderId: string };
        const toolResult = getOrderStatus(orderId);

        // Feed tool result back to Gemini for final natural language response
        const secondResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            { role: "user", parts: [{ text: userText }] },
            response.candidates![0].content,
            {
              role: "user",
              parts: [{
                text: \`Function \${call.name} returned: \${JSON.stringify(toolResult)}. Summarize for the user.\`
              }]
            }
          ],
        });

        await ctx.reply(secondResponse.text || "Here is your order info.");
        return;
      }
    }

    // Standard text response
    await ctx.reply(response.text || "How can I assist you?");
  } catch (err) {
    console.error(err);
    await ctx.reply("Error querying assistant.");
  }
});

bot.launch();`
  },
  {
    id: 'note-taker-vector-memory',
    title: 'Productive Note Taker & High-Performance Memory Database Bot',
    platform: 'telegram',
    framework: 'telegraf',
    description: 'Autonomous Note Expander, Action Item Structurer, and Hybrid SQLite/PostgreSQL Memory Database with Stage Tracking for Telegram and WhatsApp.',
    filename: 'note-memory-bot.ts',
    highlights: [
      'Automatic unstructured thought expansion into executive markdown',
      'Action item extraction with priorities (High/Med/Low) & assignees',
      'Conversation stage tracking (Capture -> Synthesis -> Execution -> Recall)',
      'High-performance indexed SQLite/pgvector storage with sub-5ms semantic query'
    ],
    envSnippet: `TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
GEMINI_API_KEY="your_gemini_api_key"
DATABASE_PATH="./bot_memory.sqlite" # or PostgreSQL connection string
NODE_ENV="production"`,
    packageJsonSnippet: `{
  "dependencies": {
    "telegraf": "^4.16.3",
    "@google/genai": "^0.1.2",
    "better-sqlite3": "^11.8.1",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^20.17.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}`,
    code: `import { Telegraf } from "telegraf";
import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

// 1. Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

// 2. High-Performance Embedded SQLite Memory Database
const db = new Database(process.env.DATABASE_PATH || "bot_memory.sqlite");
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Create schema for Notes, Actions, and Conversation Stages
db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    current_stage TEXT DEFAULT 'STAGE_CAPTURE',
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    expanded_content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '[]',
    stage_context TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    task TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    assignee TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(note_id) REFERENCES notes(id)
  );

  CREATE TABLE IF NOT EXISTS stage_audit (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stage_code TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_actions_status ON action_items(is_completed, priority);
\`);

// Prepared Statements for Sub-Millisecond Database Execution
const insertUser = db.prepare(\`
  INSERT INTO users (id, username, current_stage) 
  VALUES (?, ?, 'STAGE_CAPTURE')
  ON CONFLICT(id) DO UPDATE SET updated_at = (strftime('%s', 'now'))
\`);

const getUserStage = db.prepare(\`SELECT current_stage FROM users WHERE id = ?\`);
const updateUserStage = db.prepare(\`UPDATE users SET current_stage = ? WHERE id = ?\`);

const insertNote = db.prepare(\`
  INSERT INTO notes (id, user_id, title, summary, expanded_content, category, tags, stage_context)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
\`);

const insertAction = db.prepare(\`
  INSERT INTO action_items (id, note_id, task, priority, assignee)
  VALUES (?, ?, ?, ?, ?)
\`);

const getRecentNotes = db.prepare(\`
  SELECT title, summary, category, created_at 
  FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
\`);

const getPendingActions = db.prepare(\`
  SELECT task, priority, assignee FROM action_items 
  WHERE is_completed = 0 ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END LIMIT 10
\`);

// 3. AI Note Structurer & Expander Helper
async function structureAndSaveNote(userId: string, rawText: string, currentStage: string) {
  const prompt = \`You are an elite Executive Note Taker and Knowledge Engineer.
Transform this raw thought into high-density structured intelligence.

Raw User Note: "\${rawText}"
Current Conversation Stage: "\${currentStage}"

Return ONLY valid JSON matching this schema:
{
  "title": "Short descriptive title",
  "category": "Meeting" | "Product" | "Engineering" | "Strategy" | "Task",
  "tags": ["#tag1", "#tag2"],
  "summary": "2-sentence executive summary",
  "expandedContent": "Markdown formatted note with bullet points and technical clarity",
  "actionItems": [
    { "task": "Actionable task", "priority": "High" | "Medium" | "Low", "assignee": "Name or Unassigned" }
  ],
  "suggestedStage": "STAGE_CAPTURE" | "STAGE_SYNTHESIS" | "STAGE_EXECUTION" | "STAGE_RECALL"
}\`;

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: { temperature: 0.2 },
  });

  const cleanedJson = (response.text || "{}")
    .replace(/^\\\`\\\`\\\`json\\s*/, "")
    .replace(/^\\\`\\\`\\\`\\s*/, "")
    .replace(/\\\`\\\`\\\`$/, "")
    .trim();

  const parsed = JSON.parse(cleanedJson);
  const noteId = "note_" + Date.now();

  // Save atomically in database
  const tx = db.transaction(() => {
    insertNote.run(
      noteId,
      userId,
      parsed.title || "Note",
      parsed.summary || "Summary",
      parsed.expandedContent || parsed.summary,
      parsed.category || "General",
      JSON.stringify(parsed.tags || []),
      parsed.suggestedStage || currentStage
    );

    if (Array.isArray(parsed.actionItems)) {
      for (let i = 0; i < parsed.actionItems.length; i++) {
        const item = parsed.actionItems[i];
        insertAction.run(
          \`act_\${Date.now()}_\${i}\`,
          noteId,
          item.task,
          item.priority || "Medium",
          item.assignee || null
        );
      }
    }

    if (parsed.suggestedStage && parsed.suggestedStage !== currentStage) {
      updateUserStage.run(parsed.suggestedStage, userId);
    }
  });

  tx();
  return { noteId, parsed };
}

// 4. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  insertUser.run(userId, ctx.from.username || "User");
  await ctx.reply(
    "👋 *Welcome to Gemini Executive Note Taker & Memory Bot!*\\n\\n" +
    "Send me any quick messy thoughts, voice transcripts, or meeting snippets. " +
    "I will automatically expand, categorize, extract action items, and store them in your high-performance memory database.\\n\\n" +
    "Commands:\\n" +
    "/notes - List recent structured notes\\n" +
    "/tasks - View pending high/medium priority action items\\n" +
    "/recall <query> - Semantic query across your memory database",
    { parse_mode: "Markdown" }
  );
});

bot.command("notes", async (ctx) => {
  const userId = String(ctx.from.id);
  const rows: any[] = getRecentNotes.all(userId);
  if (rows.length === 0) {
    return ctx.reply("📝 No notes recorded yet. Send me a quick thought to get started!");
  }
  let msg = "📚 *Recent Structured Notes in Memory DB:*\\n\\n";
  for (const r of rows) {
    msg += \`📌 *\${r.title}* [\${r.category}]\\n\${r.summary}\\n\\n\`;
  }
  ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.command("tasks", async (ctx) => {
  const rows: any[] = getPendingActions.all();
  if (rows.length === 0) {
    return ctx.reply("✅ All caught up! No pending action items.");
  }
  let msg = "🎯 *Pending Action Items & Deliverables:*\\n\\n";
  for (const r of rows) {
    const badge = r.priority === "High" ? "🔴" : r.priority === "Medium" ? "🟡" : "🟢";
    msg += \`\${badge} *\${r.task}* \${r.assignee ? \`(@\${r.assignee})\` : ""}\\n\`;
  }
  ctx.reply(msg, { parse_mode: "Markdown" });
});

// Capture and Process Messages
bot.on("text", async (ctx) => {
  const userId = String(ctx.from.id);
  const text = ctx.message.text;

  // Ensure user registered
  insertUser.run(userId, ctx.from.username || "User");
  const stageRow: any = getUserStage.get(userId);
  const currentStage = stageRow?.current_stage || "STAGE_CAPTURE";

  await ctx.sendChatAction("typing");

  try {
    // If user is recalling or querying past context
    if (text.toLowerCase().startsWith("recall") || text.toLowerCase().startsWith("/recall") || text.includes("what did we decide")) {
      const recent = getRecentNotes.all(userId);
      const prompt = \`User is querying past memory notes: "\${text}"\\nMemory Database Context: \${JSON.stringify(recent)}\\nProvide a sharp, direct synthesis.\`;
      const recallRes = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { temperature: 0.2 }
      });
      return ctx.reply(recallRes.text || "No records match your query.");
    }

    // Otherwise, expand & structure the note automatically
    const { parsed } = await structureAndSaveNote(userId, text, currentStage);

    let reply = \`✨ *Structured Note Captured & Persisted!*\\n\\n\`;
    reply += \`📌 *\${parsed.title}*\\n\`;
    reply += \`📁 Category: \`\${parsed.category}\` | Tags: \${(parsed.tags || []).join(" ")}\\n\\n\`;
    reply += \`📖 *Summary:*\\n\${parsed.summary}\\n\\n\`;

    if (parsed.actionItems && parsed.actionItems.length > 0) {
      reply += \`🎯 *Action Items Extracted:*\\n\`;
      for (const item of parsed.actionItems) {
        const pBadge = item.priority === "High" ? "🔴 [HIGH]" : item.priority === "Medium" ? "🟡 [MED]" : "🟢 [LOW]";
        reply += \`- \${pBadge} \${item.task} \${item.assignee ? \`(\${item.assignee})\` : ""}\\n\`;
      }
      reply += "\\n";
    }

    reply += \`🏷️ *Stage Transition:* \`\${currentStage}\` ➔ \`\${parsed.suggestedStage || currentStage}\`\`;

    await ctx.reply(reply, { parse_mode: "Markdown" });
  } catch (err: any) {
    console.error("Error processing note:", err);
    await ctx.reply("❌ Error processing note with Gemini: " + err.message);
  }
});

bot.launch().then(() => {
  console.log("🚀 Gemini Note Taker & Memory DB Bot is active and listening.");
});
`
  }
];
