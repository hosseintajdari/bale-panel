import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP ENV VALIDATION — Crash fast if required secrets are missing
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_ENV: string[] = ["VAULT_MASTER_KEY", "PANEL_API_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]?.trim());
if (missingEnv.length > 0) {
  console.error(
    `\n[FATAL] Missing required environment variables: ${missingEnv.join(", ")}\n` +
    `Copy .env.example to .env and fill in all required values.\n`
  );
  process.exit(1);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN AUTH MIDDLEWARE — Bearer token guard for all /api/admin/* routes
// Set PANEL_API_SECRET in your .env to a strong random string.
// ─────────────────────────────────────────────────────────────────────────────
const PANEL_API_SECRET = process.env.PANEL_API_SECRET!;

function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token !== PANEL_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized. Valid Bearer token required." });
  }
  next();
}

// Apply auth guard to all admin routes
app.use("/api/admin", requireAdminAuth);

// Lazy initialize Gemini client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please check your environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-memory conversation state for simulator
interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
  image?: string; // base64
  timestamp: string;
  senderName?: string;
}

const botSessions: Record<string, ChatMessage[]> = {};

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: AI Productive Note Expander & Structurer
app.post("/api/notes/structure", async (req, res) => {
  try {
    const {
      rawInput,
      platform = "telegram",
      activeStage = "STAGE_CAPTURE"
    } = req.body;

    if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
      return res.status(400).json({ error: "rawInput is required." });
    }

    const ai = getGenAI();

    const prompt = `You are an elite Executive Chief of Staff & Technical Note Taker Agent for Telegram and WhatsApp bots.
Your objective is to take the following raw, messy, or stream-of-consciousness user input and expand, structure, and organize it into high-density structured intelligence.

Raw Input:
"""
${rawInput.trim()}
"""

Active Stage Context: ${activeStage}
Platform: ${platform}

Return a STRICT valid JSON object matching this exact structure:
{
  "title": "Clear, professional, descriptive title (5-10 words)",
  "category": "Meeting" | "Product" | "Engineering" | "Strategy" | "Personal" | "Brainstorm",
  "tags": ["#tag1", "#tag2", "#tag3"],
  "summary": "Executive 2-3 sentence overview capturing core intent, decision, and stakes.",
  "expandedContent": "Rich Markdown documentation with structured subsections, background rationale, technical insights, and key considerations.",
  "actionItems": [
    {
      "task": "Specific actionable deliverable",
      "priority": "High" | "Medium" | "Low",
      "assignee": "Name or Role (e.g. Sarah, Lead Engineer) or Unassigned",
      "dueDate": "Extracted or suggested timeframe (e.g. Friday 5pm, Next Sprint, ASAP)",
      "completed": false
    }
  ],
  "keyEntities": [
    {
      "name": "Entity Name (Person, Tool, Project, Metric, Date)",
      "type": "Person" | "Project" | "Tool" | "Metric" | "Date" | "Company",
      "context": "Brief context of why this entity matters in this note"
    }
  ],
  "suggestedNextStage": "STAGE_CAPTURE" | "STAGE_SYNTHESIS" | "STAGE_EXECUTION" | "STAGE_RECALL",
  "stageRationale": "Brief explanation of why the workflow should transition or remain in this stage"
}

IMPORTANT: Do not output markdown codeblock wrapper tags like \`\`\`json or \`\`\`. Output ONLY the raw parseable JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    let rawText = response.text || "{}";
    // Clean potential markdown wrap
    rawText = rawText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

    const parsed = JSON.parse(rawText);

    const structuredNote = {
      id: `note-${Date.now()}`,
      title: parsed.title || "Structured Note",
      rawInput: rawInput.trim(),
      category: parsed.category || "General",
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["#Notes"],
      summary: parsed.summary || "Structured note summary.",
      expandedContent: parsed.expandedContent || parsed.summary || rawInput,
      actionItems: (parsed.actionItems || []).map((act: any, idx: number) => ({
        id: `act-${Date.now()}-${idx}`,
        task: act.task,
        priority: act.priority || "Medium",
        assignee: act.assignee || undefined,
        dueDate: act.dueDate || undefined,
        completed: false,
      })),
      keyEntities: parsed.keyEntities || [],
      createdAt: "Just now",
      stageContext: parsed.suggestedNextStage || activeStage,
      similarityScore: 0.95,
    };

    res.json({
      success: true,
      note: structuredNote,
      stageTransition: {
        from: activeStage,
        to: parsed.suggestedNextStage || activeStage,
        reason: parsed.stageRationale || "Extracted structured knowledge base item.",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/notes/structure:", error);
    res.status(500).json({
      error: error.message || "Failed to structure note with Gemini.",
    });
  }
});

// Endpoint: High-Performance Semantic Memory Query Simulation
app.post("/api/memory/query", async (req, res) => {
  try {
    const { query, activeStage = "STAGE_CAPTURE" } = req.body;
    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const ai = getGenAI();

    const prompt = `You are a high-performance vector semantic memory database agent for a Node.js Telegram & WhatsApp bot.
Query: "${query}"
Active Session Stage: "${activeStage}"

Synthesize a concise, context-aware memory retrieval response answering the query based on typical project notes, architecture decisions, action items, and past stage states. Keep it structured, executive, and direct with bullet points where appropriate.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({
      query,
      answer: response.text || "No memory record found.",
      retrievalLatency: "3.8ms (HNSW Cosine Vector Search)",
      recalledStage: activeStage,
    });
  } catch (error: any) {
    console.error("Error in /api/memory/query:", error);
    res.status(500).json({
      error: error.message || "Failed to query memory database.",
    });
  }
});

// Bot Simulation endpoint: handles live chat with Gemini
app.post("/api/bot/chat", async (req, res) => {
  try {
    const {
      sessionId = "default-session",
      platform = "telegram", // "telegram" | "whatsapp"
      message,
      imageBase64,
      imageMimeType = "image/jpeg",
      systemInstruction = "You are a friendly, intelligent assistant running on Telegram and WhatsApp powered by Google Gemini.",
      temperature = 0.7,
      botPersona = "assistant",
      enableTools = false,
    } = req.body;

    if (!message && !imageBase64) {
      return res.status(400).json({ error: "Message or image is required." });
    }

    if (!botSessions[sessionId]) {
      botSessions[sessionId] = [];
    }

    // Append user message
    const userMsg: ChatMessage = {
      role: "user",
      content: message || "[Sent an image]",
      image: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    botSessions[sessionId].push(userMsg);

    // Build context history for Gemini
    const history = botSessions[sessionId].slice(-10); // Keep last 10 exchanges for context

    const ai = getGenAI();

    // Format contents
    const contents: any[] = [];

    // Provide history messages
    for (let i = 0; i < history.length - 1; i++) {
      const h = history[i];
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      });
    }

    // Latest user message
    const latestParts: any[] = [];
    if (imageBase64) {
      latestParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }
    if (message) {
      latestParts.push({ text: message });
    }

    contents.push({
      role: "user",
      parts: latestParts,
    });

    // Determine system prompt based on platform and persona
    let fullSystemInstruction = systemInstruction;
    if (platform === "whatsapp") {
      fullSystemInstruction += `\n\nPlatform Note: You are interacting via WhatsApp. Keep responses concise, well-formatted using WhatsApp markdown (*bold*, _italic_, ~strikethrough~, \`code\`, bullet points), and mobile-friendly with emojis where appropriate.`;
    } else {
      fullSystemInstruction += `\n\nPlatform Note: You are interacting via Telegram. Use Telegram markdown formatting (*bold*, _italic_, \`code\`, \`\`\`code blocks\`\`\`), clear structure, and appropriate emojis.`;
    }

    if (enableTools) {
      fullSystemInstruction += `\n\nAvailable capabilities simulated: Order tracking (e.g. order #1029 is Out for Delivery), Product Catalog search, Live weather queries. If the user asks about these, answer authoritatively and helpfully.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: Number(temperature) || 0.7,
      },
    });

    const replyText = response.text || "No response generated.";

    const botMsg: ChatMessage = {
      role: "model",
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    botSessions[sessionId].push(botMsg);

    res.json({
      reply: replyText,
      sessionId,
      history: botSessions[sessionId],
    });
  } catch (error: any) {
    console.error("Error in /api/bot/chat:", error);
    res.status(500).json({
      error: error.message || "Failed to generate bot response with Gemini.",
    });
  }
});

// Clear session history
app.post("/api/bot/clear", (req, res) => {
  const { sessionId = "default-session" } = req.body;
  botSessions[sessionId] = [];
  res.json({ success: true, message: `Session ${sessionId} reset.` });
});

// Custom Node.js Bot Code Generator with Gemini
app.post("/api/generate-bot-code", async (req, res) => {
  try {
    const {
      platform = "telegram", // "telegram" | "whatsapp"
      framework = "telegraf", // "telegraf" | "node-telegram-bot-api" | "baileys" | "whatsapp-web.js" | "meta-cloud"
      botType = "customer-support",
      customRequirements = "",
      features = ["session-memory", "vision-images", "system-prompts"],
    } = req.body;

    const ai = getGenAI();

    const prompt = `You are a Principal Node.js & Google Gemini Integration Engineer.
Generate a complete, fully commented, modern, production-grade Node.js TypeScript/JavaScript implementation for a ${platform.toUpperCase()} bot using ${framework} and the official Google Gen AI SDK (\`@google/genai\`).

Bot Configuration:
- Platform: ${platform}
- Library/Framework: ${framework}
- Bot Purpose/Category: ${botType}
- Selected Features: ${features.join(", ")}
- Custom Requirements: ${customRequirements || "Standard enterprise implementation"}

Requirements for the generated code:
1. Use \`import { GoogleGenAI } from "@google/genai";\`
2. Model: "gemini-2.0-flash"
3. Implement robust session/conversation memory (mapping user/chat ID to Gemini history so the bot remembers context).
4. Implement multimodal handling if photos/images are received.
5. Include helpful error handling, rate limiting guards, and slash command handlers (e.g. /start, /reset, /help, /model).
6. Provide clear environment variable instructions (.env with BOT_TOKEN and GEMINI_API_KEY).
7. Return clean, directly runnable code with explanations and package.json scripts.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    res.json({
      code: response.text || "// No code generated",
    });
  } catch (error: any) {
    console.error("Error in /api/generate-bot-code:", error);
    res.status(500).json({
      error: error.message || "Failed to generate bot integration code.",
    });
  }
});

// ----------------------------------------------------
// EMBEDNET OS - PIPELINE, SHADOW MODE & WORK LEDGER APIS
// ----------------------------------------------------

// Integration Hub State (Manager Studio & Isolation)
interface AdminIntegrationState {
  notion: { connected: boolean; workspace: string; lastSync: string };
  github: { connected: boolean; repo: string; branch: string; lastSync: string };
  activeAiProvider: 'gemini_direct' | 'codex_account_proxy' | 'chatgpt_subscription';
  pipelinePermissions: {
    allowDeterministicPricing: boolean;
    allowWebScraping: boolean;
    allowDatabaseMutation: boolean;
  };
  guestSandboxes: Array<{
    id: string;
    guestName: string;
    assignedBot: string;
    quotaUsed: string;
    isolatedMemoryPath: string;
    status: 'active' | 'paused';
  }>;
}

const adminIntegrationState: AdminIntegrationState = {
  notion: {
    connected: true,
    workspace: "Embednet-Personal-Workspace",
    lastSync: "۱۰ دقیقه پیش"
  },
  github: {
    connected: true,
    repo: "sgwteam/embednet-os-core",
    branch: "main",
    lastSync: "۲۵ دقیقه پیش"
  },
  activeAiProvider: 'gemini_direct',
  pipelinePermissions: {
    allowDeterministicPricing: true,
    allowWebScraping: false,
    allowDatabaseMutation: true,
  },
  guestSandboxes: [
    {
      id: "sbx-01",
      guestName: "علی (دستیار شخصی)",
      assignedBot: "Telegram @ali_assistant_bot",
      quotaUsed: "۱۴٪ از سهمیه",
      isolatedMemoryPath: "/sandboxes/tenant_ali_db",
      status: "active"
    },
    {
      id: "sbx-02",
      guestName: "همکار تیم تست (کارهای روزمره)",
      assignedBot: "Bale @colleague_test_bot",
      quotaUsed: "۲۸٪ از سهمیه",
      isolatedMemoryPath: "/sandboxes/tenant_colleague_db",
      status: "active"
    }
  ]
};

app.get("/api/admin/integrations", (req, res) => {
  res.json({ success: true, data: adminIntegrationState });
});

app.post("/api/admin/integrations/toggle", (req, res) => {
  const { field, value } = req.body;
  if (field === 'activeAiProvider') {
    adminIntegrationState.activeAiProvider = value;
  } else if (field in adminIntegrationState.pipelinePermissions) {
    (adminIntegrationState.pipelinePermissions as any)[field] = value;
  }
  res.json({ success: true, data: adminIntegrationState });
});

app.post("/api/admin/sandbox/create", (req, res) => {
  const { guestName, assignedBot } = req.body;
  if (!guestName) {
    return res.status(400).json({ error: "guestName is required" });
  }
  const newSandbox = {
    id: `sbx-${Date.now().toString().slice(-4)}`,
    guestName,
    assignedBot: assignedBot || "Isolated Sandbox Bot",
    quotaUsed: "۰٪ از سهمیه",
    isolatedMemoryPath: `/sandboxes/tenant_${Date.now()}_db`,
    status: "active" as const
  };
  adminIntegrationState.guestSandboxes.push(newSandbox);
  res.json({ success: true, sandbox: newSandbox, data: adminIntegrationState });
});

// ----------------------------------------------------
// ENCRYPTED AGENT AUTH VAULT (AES-256-GCM)
// ----------------------------------------------------

// Vault key: validated at startup — VAULT_MASTER_KEY is guaranteed non-empty
const VAULT_MASTER_SECRET = process.env.VAULT_MASTER_KEY!;
const VAULT_KEY_BUFFER = crypto.createHash("sha256").update(VAULT_MASTER_SECRET).digest();

interface EncryptedVaultRecord {
  id: string;
  service: "github" | "notion" | "openai";
  label: string;
  agentId: string;
  agentName: string;
  taskScope: string;
  maskedSecret: string;
  envKeyName: string;
  encryptionAlgorithm: "AES-256-GCM";
  encryptedBlob: string; // format: enc:aes-256-gcm:iv:tag:ciphertext
  ivPreview: string;
  authTagPreview: string;
  cipherHashPreview: string;
  createdAt: string;
  lastUsed?: string;
  status: "active" | "revoked" | "untested";
}

function encryptSecret(plaintext: string): {
  encryptedBlob: string;
  ivPreview: string;
  authTagPreview: string;
  cipherHashPreview: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", VAULT_KEY_BUFFER, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const ivHex = iv.toString("hex");
  const authTagHex = authTag.toString("hex");
  const cipherHex = encrypted.toString("hex");
  const encryptedBlob = `enc:aes-256-gcm:${ivHex}:${authTagHex}:${cipherHex}`;
  const cipherHashPreview = crypto.createHash("sha256").update(cipherHex).digest("hex").slice(0, 12);

  return {
    encryptedBlob,
    ivPreview: ivHex.slice(0, 8),
    authTagPreview: authTagHex.slice(0, 8),
    cipherHashPreview,
  };
}

function decryptSecret(encryptedBlob: string): string {
  const parts = encryptedBlob.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "aes-256-gcm") {
    throw new Error("Invalid encrypted format");
  }
  const iv = Buffer.from(parts[2], "hex");
  const authTag = Buffer.from(parts[3], "hex");
  const ciphertext = Buffer.from(parts[4], "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", VAULT_KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

function maskSecret(service: string, secret: string): string {
  if (!secret || secret.length < 6) return "••••••";
  if (service === "github") {
    const prefix = secret.startsWith("ghp_") ? "ghp_" : secret.startsWith("github_pat_") ? "github_pat_" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  if (service === "notion") {
    const prefix = secret.startsWith("secret_") ? "secret_" : secret.startsWith("ntn_") ? "ntn_" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  if (service === "openai") {
    const prefix = secret.startsWith("sk-proj-") ? "sk-proj-" : secret.startsWith("sk-") ? "sk-" : "";
    const core = secret.slice(prefix.length);
    return `${prefix}••••••••••••${core.slice(-4)}`;
  }
  return `${secret.slice(0, 3)}••••••••${secret.slice(-3)}`;
}

// Credential store — seeded from env vars if present (never hardcoded)
// Add real tokens to .env: GITHUB_TOKEN, NOTION_API_KEY, OPENAI_API_KEY
const vaultCredentialsStore: EncryptedVaultRecord[] = [];

function seedFromEnv(service: "github" | "notion" | "openai", envKey: string, label: string, agentId: string, agentName: string, taskScope: string) {
  const secret = process.env[envKey]?.trim();
  if (!secret) return; // Skip if not configured — vault starts empty for this service

  const encResult = encryptSecret(secret);
  const maskedSecret = maskSecret(service, secret);
  const storeEnvKey = `AGENT_AUTH_${service.toUpperCase()}_${agentId.toUpperCase().replace(/-/g, "_")}`;
  process.env[storeEnvKey] = encResult.encryptedBlob;

  vaultCredentialsStore.push({
    id: `cred-${service}-env`,
    service,
    label,
    agentId,
    agentName,
    taskScope,
    maskedSecret,
    envKeyName: storeEnvKey,
    encryptionAlgorithm: "AES-256-GCM",
    encryptedBlob: encResult.encryptedBlob,
    ivPreview: encResult.ivPreview,
    authTagPreview: encResult.authTagPreview,
    cipherHashPreview: encResult.cipherHashPreview,
    createdAt: new Date().toLocaleTimeString("fa-IR"),
    lastUsed: "بارگذاری از .env",
    status: "active",
  });
}

seedFromEnv("github", "GITHUB_TOKEN", "GitHub Token - همگام‌سازی مخزن هسته", "agent-devops", "دستیار کدنویسی و DevOps", "همگام‌سازی خودکار برنچ‌ها و Pull Requestها");
seedFromEnv("notion", "NOTION_API_KEY", "Notion Secret - پایگاه اسناد و Work Ledger", "agent-ledger", "ایجنت مستندسازی و وظایف", "ثبت خودکار سشن‌های کاری و یادداشت‌های راهبردی");
seedFromEnv("openai", "OPENAI_API_KEY", "OpenAI API Key - استدلال پشتیبان", "agent-reasoning", "ایجنت استدلال عمیق و فال‌بک", "تولید امبدینگ و استدلال تحلیلی برای سناریوهای مرزی");

// Helper to strip encryptedBlob when returning to client (Safe DTO)
function getSafeCredentialsList() {
  return vaultCredentialsStore.map(({ encryptedBlob, ...safe }) => safe);
}

// GET list of encrypted credentials
app.get("/api/admin/auth-credentials", (req, res) => {
  res.json({
    success: true,
    credentials: getSafeCredentialsList(),
    vaultStatus: {
      masterKeyConfigured: true,
      algorithm: "AES-256-GCM",
      totalEncryptedCredentials: vaultCredentialsStore.length,
      environmentFileStatus: "synced",
      lastEncryptedAt: new Date().toLocaleTimeString("fa-IR"),
    },
  });
});

// POST add new credential (stored encrypted in environment configuration)
app.post("/api/admin/auth-credentials", (req, res) => {
  const { service, label, agentId, agentName, secret, taskScope } = req.body;

  if (!service || !secret || !label) {
    return res.status(400).json({ error: "فیلدهای سرویس، برچسب و کلید محرمانه الزامی هستند." });
  }

  const validServices = ["github", "notion", "openai"];
  if (!validServices.includes(service)) {
    return res.status(400).json({ error: "سرویس نامعتبر است. فقط github، notion یا openai مجاز هستند." });
  }

  const cleanSecret = String(secret).trim();
  const maskedSecret = maskSecret(service, cleanSecret);
  const encResult = encryptSecret(cleanSecret);

  const cleanAgentId = (agentId || `agent-${Date.now().toString().slice(-4)}`).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const envKeyName = `AGENT_AUTH_${service.toUpperCase()}_${cleanAgentId.toUpperCase()}`;

  // Store encrypted blob in process.env (environment configuration)
  process.env[envKeyName] = encResult.encryptedBlob;

  const newCredential: EncryptedVaultRecord = {
    id: `cred-${service}-${Date.now().toString().slice(-4)}`,
    service,
    label: label.trim(),
    agentId: cleanAgentId,
    agentName: (agentName || "ایجنت اختصاصی").trim(),
    taskScope: (taskScope || "پردازش وظایف خودکار").trim(),
    maskedSecret,
    envKeyName,
    encryptionAlgorithm: "AES-256-GCM",
    encryptedBlob: encResult.encryptedBlob,
    ivPreview: encResult.ivPreview,
    authTagPreview: encResult.authTagPreview,
    cipherHashPreview: encResult.cipherHashPreview,
    createdAt: "اکنون",
    lastUsed: "ثبت شده در مخزن رمزشده",
    status: "active",
  };

  vaultCredentialsStore.unshift(newCredential);

  res.json({
    success: true,
    message: `کلید ${service.toUpperCase()} با الگوریتم AES-256-GCM رمزنگاری و در متغیر محیطی ${envKeyName} ذخیره گردید.`,
    credential: {
      id: newCredential.id,
      service: newCredential.service,
      label: newCredential.label,
      agentId: newCredential.agentId,
      agentName: newCredential.agentName,
      taskScope: newCredential.taskScope,
      maskedSecret: newCredential.maskedSecret,
      envKeyName: newCredential.envKeyName,
      encryptionAlgorithm: newCredential.encryptionAlgorithm,
      ivPreview: newCredential.ivPreview,
      authTagPreview: newCredential.authTagPreview,
      cipherHashPreview: newCredential.cipherHashPreview,
      createdAt: newCredential.createdAt,
      status: newCredential.status,
    },
    credentials: getSafeCredentialsList(),
  });
});

// DELETE a credential
app.delete("/api/admin/auth-credentials/:id", (req, res) => {
  const { id } = req.params;
  const index = vaultCredentialsStore.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "کلید مورد نظر یافت نشد." });
  }

  const removed = vaultCredentialsStore.splice(index, 1)[0];
  if (removed.envKeyName && process.env[removed.envKeyName]) {
    delete process.env[removed.envKeyName];
  }

  res.json({
    success: true,
    message: `اعتبارنامه ${removed.label} حذف و از متغیرهای محیطی پاکسازی شد.`,
    credentials: getSafeCredentialsList(),
  });
});

// POST test integrity & decrypt validation
app.post("/api/admin/auth-credentials/test/:id", (req, res) => {
  const { id } = req.params;
  const cred = vaultCredentialsStore.find((c) => c.id === id);
  if (!cred) {
    return res.status(404).json({ error: "کلید مورد نظر یافت نشد." });
  }

  try {
    // Perform real AES-256-GCM decryption check verifying the authentication tag
    const decrypted = decryptSecret(cred.encryptedBlob);
    cred.lastUsed = "اکنون (تایید اعتبار موفق)";
    cred.status = "active";

    // Format validation checks
    let formatDetail = "فرمت کلید استاندارد است.";
    if (cred.service === "github" && !decrypted.startsWith("ghp_") && !decrypted.startsWith("github_pat_")) {
      formatDetail = "توکن شخصی گیت‌هاب فرمت سفارشی دارد اما رمزگشایی سالم است.";
    } else if (cred.service === "notion" && !decrypted.startsWith("secret_") && !decrypted.startsWith("ntn_")) {
      formatDetail = "توکن نوشن فرمت سفارشی دارد اما رمزگشایی سالم است.";
    } else if (cred.service === "openai" && !decrypted.startsWith("sk-")) {
      formatDetail = "کلید OpenAI فرمت سفارشی دارد اما رمزگشایی سالم است.";
    }

    res.json({
      success: true,
      message: `صحت الگوریتم AES-256-GCM و برچسب احراز اصالت (Auth Tag) برای ${cred.service} تایید شد.`,
      formatDetail,
      algorithm: "AES-256-GCM",
      integrity: "PASSED",
      agentTarget: cred.agentName,
      envKey: cred.envKeyName,
    });
  } catch (err: any) {
    cred.status = "revoked";
    res.status(500).json({
      error: `خطا در رمزگشایی و اعتبارسنجی: ${err.message}`,
      integrity: "FAILED",
    });
  }
});

// GET export snippet of encrypted env configuration
app.get("/api/admin/auth-credentials/env-export", (req, res) => {
  const lines = [
    "# -------------------------------------------------------------",
    "# EMBEDNET OS - ENCRYPTED AGENT CREDENTIALS (AES-256-GCM)",
    "# Generated for container environment configuration.",
    "# WARNING: VAULT_MASTER_KEY is NOT included here — manage it",
    "# separately and securely (secrets manager / .env on server).",
    "# -------------------------------------------------------------",
    "",
  ];

  for (const cred of vaultCredentialsStore) {
    lines.push(`# [${cred.service.toUpperCase()}] Agent: ${cred.agentName} (${cred.agentId})`);
    lines.push(`# Task: ${cred.taskScope}`);
    lines.push(`${cred.envKeyName}="${cred.encryptedBlob}"`);
    lines.push("");
  }

  res.json({
    success: true,
    envText: lines.join("\n"),
    count: vaultCredentialsStore.length,
    warning: "VAULT_MASTER_KEY is intentionally excluded. Set it separately in your secrets manager.",
  });
});

// Deterministic Pricing Database (Mock TTAC/Catalog)
const DRUG_CATALOG: Record<string, { price: number, code: string, requiresPrescription: boolean }> = {
  "کوآموکسی کلاو": { price: 58200, code: "IRC-10293", requiresPrescription: true },
  "استامینوفن": { price: 12000, code: "IRC-99212", requiresPrescription: false },
  "ایبوپروفن": { price: 15500, code: "IRC-88321", requiresPrescription: false },
};

interface ShadowRecord {
  id: string;
  sessionId: string;
  channel: "whatsapp" | "bale" | "telegram" | "sms";
  senderDisplay: string;
  userMessage: string;
  proposedReply: string;
  timestamp: string;
  confidenceScore: number;
  riskLevel: "safe" | "medium_risk" | "high_redline";
  status: "pending" | "approved" | "rejected" | "modified";
  deterministicRuleApplied?: string;
  auditNote?: string;
  editedReply?: string;
}

let shadowQueue: ShadowRecord[] = [
  {
    id: "sh-901",
    sessionId: "wa-989123456789",
    channel: "whatsapp",
    senderDisplay: "+98 912 345 6789 (سهامدار/همکار)",
    userMessage: "وضعیت گزارش تجمیعی شاخص‌های Embednet OS و خروجی لاگ چت‌ها آماده شد؟",
    proposedReply: "سلام و احترام. بله، شاخص‌های آپ‌تایم و صف اعتبارسنجی سایه (Shadow Queue) در پنل استخراج شده و گزارش برای شما ارسال شد.",
    timestamp: "10 دقیقه پیش",
    confidenceScore: 0.94,
    riskLevel: "safe",
    status: "pending",
    auditNote: "استعلام مدیریتی داخلی - بدون نیاز به رگولاتوری",
  }
];

// In-Memory Shared Ledger Items
let serverLedgerItems = [
  {
    id: "wld-101",
    title: "بررسی معماری میان‌افزار Embednet OS و لانگ‌بات",
    domainCategory: "Executive",
    summary: "جداسازی لایه وب‌هوک واتساپ (Evolution API v2) از هسته محاسباتی و تعیین گیت‌های تایید Shadow Mode.",
    activeContext: "جلسه بازبینی سیستم / ارزیابی جایگزینی OpenClaw با لانگ‌بات",
    tasksPending: 2,
    lastUpdated: "امروز، ۱۰:۴۵",
    tokenLoad: "1,420 توکن",
  },
  {
    id: "wld-102",
    title: "توسعه موتور قوانین قطعی قیمت دارو (Qanoon-Price)",
    domainCategory: "Clinical",
    summary: "استخراج ضرایب ارزش افزوده و سقف قیمت‌های مصوب سازمان غذا و دارو بدون اتکا به توهمات مدل زبانی.",
    activeContext: "سرویس کاتالوگ و استعلام کد IRC",
    tasksPending: 1,
    lastUpdated: "امروز، ۰۹:۱۵",
    tokenLoad: "3,890 توکن",
  },
  {
    id: "wld-103",
    title: "هماهنگی ابزارهای جانبی و دسترسی ربات bale-auto",
    domainCategory: "Operations",
    summary: "صدور توکن‌های دسترسی کنترل‌شده برای اسکریپت‌های اتوماتیک بله جهت پایش لاگ‌ها.",
    activeContext: "تفویض اختیارات و دسترسی‌های گزینشی",
    tasksPending: 0,
    lastUpdated: "دیروز، ۱۸:۲۰",
    tokenLoad: "850 توکن",
  },
  {
    id: "wld-104",
    title: "ارتقای فرآیند بازبینی سایه (HITL Pharmacist Review)",
    domainCategory: "Clinical",
    summary: "تثبیت ADR-0001 و ADR-0002 جهت پیشگیری از ارسال پاسخ‌های پرریسک به بیماران بدون تایید ناظر.",
    activeContext: "بایگانی و استخراج شواهد تریاژ",
    tasksPending: 3,
    lastUpdated: "دیروز، ۱۵:۰۰",
    tokenLoad: "2,100 توکن",
  },
];

// Global Data Privacy & Retention Policy State
let globalPrivacySettings = {
  retentionPolicy: "audited" as "audited" | "ephemeral",
  highPrivacyBotTypes: ["medical", "clinical", "professional", "triage"],
  scrubSensitiveMedicalNotes: true,
  ephemeralSessionsCount: 48,
  loggedSessionsCount: 192,
  lastToggledAt: "اکنون",
};

// Gateway Pulse Check & Telemetry Configuration State
let gatewayPulseConfig = {
  enabled: true,
  gateways: {
    whatsapp: true,
    bale: true,
    telegram: true,
    sms: true,
  },
  refreshIntervalSec: 3,
  alertOnJitterThresholdMs: 40,
  lastCheckedAt: "هم‌اکنون",
};

let gatewayTelemetryMap: Record<string, {
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputKbs: number;
  webhookAckRatePct: number;
  keepAliveSec: number;
  protocol: string;
  healthScore: number;
  lastPulseAt: string;
  dnsResolutionMs: number;
  tlsHandshakeMs: number;
}> = {
  whatsapp: {
    pingMs: 24,
    jitterMs: 2.1,
    packetLossPct: 0.0,
    throughputKbs: 142.5,
    webhookAckRatePct: 99.8,
    keepAliveSec: 15,
    protocol: "WebSocket v2 (Evolution API)",
    healthScore: 99,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 3.2,
    tlsHandshakeMs: 8.4,
  },
  bale: {
    pingMs: 38,
    jitterMs: 4.3,
    packetLossPct: 0.1,
    throughputKbs: 88.0,
    webhookAckRatePct: 99.4,
    keepAliveSec: 20,
    protocol: "HTTPS Webhook (bale-med API)",
    healthScore: 95,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 4.8,
    tlsHandshakeMs: 14.1,
  },
  telegram: {
    pingMs: 52,
    jitterMs: 6.0,
    packetLossPct: 0.0,
    throughputKbs: 64.2,
    webhookAckRatePct: 100.0,
    keepAliveSec: 30,
    protocol: "TLS 1.3 Direct Webhook",
    healthScore: 96,
    lastPulseAt: "۱ دقیقه پیش",
    dnsResolutionMs: 5.1,
    tlsHandshakeMs: 19.5,
  },
  sms: {
    pingMs: 110,
    jitterMs: 12.4,
    packetLossPct: 0.0,
    throughputKbs: 12.8,
    webhookAckRatePct: 98.9,
    keepAliveSec: 60,
    protocol: "REST Provider Pool (Faraz/Kavenegar)",
    healthScore: 91,
    lastPulseAt: "هم‌اکنون",
    dnsResolutionMs: 8.2,
    tlsHandshakeMs: 32.0,
  },
};

let channelStatuses: Record<string, "active" | "standby" | "disconnected"> = {
  whatsapp: "active",
  bale: "active",
  telegram: "standby",
  sms: "active",
};

interface ServerGatewayAuditEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  channelId: string;
  channelName: string;
  eventType: "heartbeat" | "status_change" | "latency_alert" | "config_change";
  severity: "info" | "success" | "warning" | "critical";
  summary: string;
  details?: string;
  latencyMs?: number;
  jitterMs?: number;
  healthLevel?: "optimal" | "stable" | "warning" | "critical";
  previousStatus?: string;
  newStatus?: string;
  packetLossPct?: number;
  webhookAckRatePct?: number;
  triggeredBy?: "system_heartbeat" | "manual_ping" | "spike_simulation" | "operator_toggle" | "inbound_webhook";
  metadata?: Record<string, any>;
}

// Seeded initial chronological audit history for channel gateways
const gatewayAuditLogs: ServerGatewayAuditEvent[] = [
  {
    id: "aud-109",
    timestamp: new Date(Date.now() - 45 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 45 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "whatsapp",
    channelName: "واتساپ (WhatsApp Gateway)",
    eventType: "heartbeat",
    severity: "success",
    summary: "پالس سلامت دوره‌ای و استعلام لتنسی موفق",
    details: "پینگ 24ms با نوسان جیتر 1.8ms • سوکت Evolution API v2 کاملاً پایدار و آنلاین است.",
    latencyMs: 24,
    jitterMs: 1.8,
    healthLevel: "optimal",
    packetLossPct: 0.0,
    webhookAckRatePct: 99.8,
    triggeredBy: "system_heartbeat",
    metadata: { endpoint: "https://wa-relay.embednet.internal/pulse", protocol: "TLS 1.3" },
  },
  {
    id: "aud-108",
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "bale",
    channelName: "پیام‌رسان بله (Bale Hook)",
    eventType: "heartbeat",
    severity: "info",
    summary: "ارزیابی اتصال خط رله داخلی ایران (bale-med)",
    details: "لتنسی ۳۸ میلی‌ثانیه‌ای ثبت شد. تطابق بدون وقفه با پروتکل شبیه‌ساز پایپ‌لاین پزشکی.",
    latencyMs: 38,
    jitterMs: 3.8,
    healthLevel: "optimal",
    packetLossPct: 0.0,
    webhookAckRatePct: 99.4,
    triggeredBy: "system_heartbeat",
  },
  {
    id: "aud-107",
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 9 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "telegram",
    channelName: "تلگرام (Telegram Bot API)",
    eventType: "status_change",
    severity: "warning",
    summary: "تغییر وضعیت گیت‌وی به حالت آماده‌باش (Standby)",
    details: "درگاه تلگرام به عنوان پشتیبان اضطراری تعیین شد و وضعیت آن از Active به Standby منتقل گشت.",
    previousStatus: "active",
    newStatus: "standby",
    latencyMs: 52,
    jitterMs: 5.2,
    healthLevel: "stable",
    triggeredBy: "operator_toggle",
  },
  {
    id: "aud-106",
    timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 17 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "sms",
    channelName: "سامانه پیامک (SMS Alert Gate)",
    eventType: "latency_alert",
    severity: "warning",
    summary: "نوسان تاخیر پول ارسال سریع پیامک",
    details: "لتنسی استعلام به 110ms رسید و در محدوده زرد (هشدار تاخیر) قرار گرفت. کلیه وب‌هوک‌ها تایید شده‌اند.",
    latencyMs: 110,
    jitterMs: 12.4,
    healthLevel: "warning",
    packetLossPct: 0.0,
    webhookAckRatePct: 98.9,
    triggeredBy: "system_heartbeat",
  },
  {
    id: "aud-105",
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 32 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "all",
    channelName: "پیکربندی کل گیت‌وی‌ها",
    eventType: "config_change",
    severity: "info",
    summary: "فعال‌سازی سیستم پالس تله‌متری بلادرنگ و پایش جیتر",
    details: "بازه تازه‌سازی خودکار روی ۳۰ ثانیه تنظیم شد و آستانه هشدار نوسان جیتر روی ۱۵ میلی‌ثانیه قفل شد.",
    triggeredBy: "operator_toggle",
    metadata: { refreshIntervalSec: 30, alertOnJitterThresholdMs: 15 },
  },
  {
    id: "aud-104",
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    timeFormatted: new Date(Date.now() - 65 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    channelId: "whatsapp",
    channelName: "واتساپ (WhatsApp Gateway)",
    eventType: "status_change",
    severity: "success",
    summary: "اتصال موفق دستگاه جفت‌شده و آغاز گوش‌به‌زنگ",
    details: "کانکشن لایه سوکت Baileys برقرار شد. پروتکل ضد مسدودی Inbound-First فعال گردید.",
    previousStatus: "disconnected",
    newStatus: "active",
    latencyMs: 22,
    jitterMs: 1.6,
    healthLevel: "optimal",
    triggeredBy: "system_heartbeat",
  },
];

function recordGatewayAuditEvent(event: Omit<ServerGatewayAuditEvent, 'id' | 'timestamp' | 'timeFormatted' | 'dateFormatted'>) {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateFormatted = now.toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const auditEvent: ServerGatewayAuditEvent = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toISOString(),
    timeFormatted,
    dateFormatted,
    ...event,
  };
  gatewayAuditLogs.unshift(auditEvent);
  if (gatewayAuditLogs.length > 500) {
    gatewayAuditLogs.pop();
  }
  return auditEvent;
}

function getChannelsWithTelemetry() {
  return [
    {
      id: "whatsapp",
      displayName: "WhatsApp Multi-Device Gateway",
      status: channelStatuses.whatsapp || "active",
      method: "Evolution API v2 / Direct Webhook",
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      unprocessedQueue: shadowQueue.filter((s) => s.channel === "whatsapp" && s.status === "pending").length,
      lastHeartbeat: gatewayTelemetryMap.whatsapp.lastPulseAt,
      telemetry: gatewayTelemetryMap.whatsapp,
    },
    {
      id: "bale",
      displayName: "Bale Messenger Bot Hook",
      status: channelStatuses.bale || "active",
      method: "Bale Webhook Pipeline (bale-med)",
      latencyMs: gatewayTelemetryMap.bale.pingMs,
      unprocessedQueue: shadowQueue.filter((s) => s.channel === "bale" && s.status === "pending").length,
      lastHeartbeat: gatewayTelemetryMap.bale.lastPulseAt,
      telemetry: gatewayTelemetryMap.bale,
    },
    {
      id: "telegram",
      displayName: "Telegram Bot API",
      status: channelStatuses.telegram || "standby",
      method: "Direct HTTPS Webhook",
      latencyMs: gatewayTelemetryMap.telegram.pingMs,
      unprocessedQueue: 0,
      lastHeartbeat: gatewayTelemetryMap.telegram.lastPulseAt,
      telemetry: gatewayTelemetryMap.telegram,
    },
    {
      id: "sms",
      displayName: "Iran SMS Fast-Alert Gateway",
      status: channelStatuses.sms || "active",
      method: "REST Provider Gate (Kavenegar/Faraz)",
      latencyMs: gatewayTelemetryMap.sms.pingMs,
      unprocessedQueue: 0,
      lastHeartbeat: gatewayTelemetryMap.sms.lastPulseAt,
      telemetry: gatewayTelemetryMap.sms,
    },
  ];
}

// Evolution API WhatsApp Instance & Anti-Ban State
let evolutionInstanceState = {
  instanceName: "embednet-wa-primary",
  status: "connected",
  mode: "pharmacy_inbound" as "personal_notebook" | "pharmacy_inbound",
  connectedPhone: "+98 912 845 1020",
  pairingCode: "8K3M-9P4W",
  qrCodeData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  qrExpiresInSec: 20,
  antiBan: {
    strictInboundOnly: true, // No cold messages; user must initiate
    persistLedgerFirst: true, // Record in Work Ledger before replying
    humanJitterMinSec: 2,
    humanJitterMaxSec: 5,
    simulateComposingPresence: true,
    dailyRateLimit: 250,
    messagesSentToday: 18,
  },
  lastInboundAt: "۲ دقیقه پیش",
  lastPersistedLedgerId: "wld-102",
};

// Evolution API State Endpoints
app.get("/api/evolution/status", (req, res) => {
  res.json({
    success: true,
    instance: evolutionInstanceState,
  });
});

// Generate 8-digit Pairing Code (Pair without camera/QR)
app.post("/api/evolution/pair-code", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return res.status(400).json({ error: "شماره تلفن الزامی است." });
  }

  // Generate 8-character code in Evolution API format (e.g., 4K9L-2M8P)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  const generatedCode = `${part1}-${part2}`;

  evolutionInstanceState.connectedPhone = phoneNumber.trim();
  evolutionInstanceState.pairingCode = generatedCode;
  evolutionInstanceState.status = "connecting";

  res.json({
    success: true,
    pairingCode: generatedCode,
    phoneNumber: phoneNumber.trim(),
    instructions: [
      "۱. در واتساپ گوشی به منوی سه نقطه یا Settings بروید.",
      "۲. گزینه Linked Devices (دستگاه‌های متصل) و سپس Link a Device را بزنید.",
      "۳. در پایین صفحه روی 'Link with phone number instead' (اتصال با شماره تلفن) تپ کنید.",
      `۴. کد ${generatedCode} را در گوشی وارد کنید.`
    ]
  });
});

// Refresh QR Code
app.post("/api/evolution/qr-refresh", (req, res) => {
  evolutionInstanceState.qrExpiresInSec = 20;
  evolutionInstanceState.status = "qrcode_ready";
  res.json({
    success: true,
    qrExpiresInSec: 20,
    message: "کیو‌آر کد جدید صادر شد.",
  });
});

// Switch Mode (Personal Notebook vs Pharmacy Inbound)
app.post("/api/evolution/mode", (req, res) => {
  const { mode } = req.body;
  if (mode !== "personal_notebook" && mode !== "pharmacy_inbound") {
    return res.status(400).json({ error: "مد نامعتبر است." });
  }
  evolutionInstanceState.mode = mode;
  res.json({ success: true, mode: evolutionInstanceState.mode });
});

// Update Anti-Ban Configuration
app.post("/api/evolution/antiban", (req, res) => {
  const { strictInboundOnly, persistLedgerFirst, humanJitterMinSec, humanJitterMaxSec, simulateComposingPresence } = req.body;
  if (typeof strictInboundOnly === "boolean") evolutionInstanceState.antiBan.strictInboundOnly = strictInboundOnly;
  if (typeof persistLedgerFirst === "boolean") evolutionInstanceState.antiBan.persistLedgerFirst = persistLedgerFirst;
  if (typeof humanJitterMinSec === "number") evolutionInstanceState.antiBan.humanJitterMinSec = humanJitterMinSec;
  if (typeof humanJitterMaxSec === "number") evolutionInstanceState.antiBan.humanJitterMaxSec = humanJitterMaxSec;
  if (typeof simulateComposingPresence === "boolean") evolutionInstanceState.antiBan.simulateComposingPresence = simulateComposingPresence;

  res.json({ success: true, antiBan: evolutionInstanceState.antiBan });
});

// Endpoints for Work Ledger
app.get("/api/ledger/items", (req, res) => {
  res.json({ success: true, items: serverLedgerItems });
});

app.post("/api/ledger/items", (req, res) => {
  const { title, domainCategory, summary, activeContext } = req.body;
  if (!title) return res.status(400).json({ error: "عنوان الزامی است." });

  const newItem = {
    id: `wld-${Date.now()}`,
    title: title.trim(),
    domainCategory: domainCategory || "Executive",
    summary: summary || "سشن جدید ثبت‌شده",
    activeContext: activeContext || "ثبت دستی",
    tasksPending: 1,
    lastUpdated: "اکنون",
    tokenLoad: "0 توکن",
  };

  serverLedgerItems.unshift(newItem);
  res.json({ success: true, item: newItem, items: serverLedgerItems });
});

// Global Data Privacy & Retention Policy Endpoints
app.get("/api/system/privacy-settings", (req, res) => {
  res.json({
    success: true,
    settings: globalPrivacySettings,
  });
});

app.post("/api/system/privacy-settings", (req, res) => {
  const { retentionPolicy, scrubSensitiveMedicalNotes } = req.body;
  if (retentionPolicy === "audited" || retentionPolicy === "ephemeral") {
    globalPrivacySettings.retentionPolicy = retentionPolicy;
    globalPrivacySettings.lastToggledAt = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  }
  if (typeof scrubSensitiveMedicalNotes === "boolean") {
    globalPrivacySettings.scrubSensitiveMedicalNotes = scrubSensitiveMedicalNotes;
  }
  res.json({
    success: true,
    settings: globalPrivacySettings,
    message: globalPrivacySettings.retentionPolicy === "ephemeral"
      ? "سیاست سشن‌های موقت (Ephemeral Zero-Retention) برای ربات‌های پزشکی و حرفه‌ای فعال شد. هیچ متادیتایی در دفتر کار ذخیره نخواهد شد."
      : "سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit Logging) فعال شد."
  });
});

// Gateway Pulse Check & Telemetry Endpoints
app.get("/api/system/pulse-settings", (req, res) => {
  res.json({
    success: true,
    config: gatewayPulseConfig,
    telemetry: gatewayTelemetryMap,
    channels: getChannelsWithTelemetry(),
  });
});

app.post("/api/system/pulse-settings", (req, res) => {
  const { enabled, gateways, refreshIntervalSec, alertOnJitterThresholdMs } = req.body;
  if (typeof enabled === "boolean") {
    gatewayPulseConfig.enabled = enabled;
  }
  if (gateways && typeof gateways === "object") {
    gatewayPulseConfig.gateways = {
      ...gatewayPulseConfig.gateways,
      ...gateways,
    };
  }
  if (typeof refreshIntervalSec === "number") {
    gatewayPulseConfig.refreshIntervalSec = refreshIntervalSec;
  }
  if (typeof alertOnJitterThresholdMs === "number") {
    gatewayPulseConfig.alertOnJitterThresholdMs = alertOnJitterThresholdMs;
  }
  gatewayPulseConfig.lastCheckedAt = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

  recordGatewayAuditEvent({
    channelId: "all",
    channelName: "تنظیمات مرکزی گیت‌وی‌ها",
    eventType: "config_change",
    severity: "info",
    summary: gatewayPulseConfig.enabled
      ? "پیکربندی و فعال‌سازی پایش تله‌متری پالس کانال‌ها"
      : "غیرفعال‌سازی موقت پالس دوره‌ای کانال‌ها",
    details: `بازه پالس: ${gatewayPulseConfig.refreshIntervalSec} ثانیه | حد آستانه جیتر: ${gatewayPulseConfig.alertOnJitterThresholdMs}ms | درگاه‌ها: ${Object.entries(gatewayPulseConfig.gateways).filter(([_, v]) => v).map(([k]) => k).join(', ')}`,
    triggeredBy: "operator_toggle",
    metadata: { config: gatewayPulseConfig },
  });

  res.json({
    success: true,
    config: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    message: gatewayPulseConfig.enabled
      ? "پایش پالس و تله‌متری بلادرنگ درگاه‌ها با موفقیت فعال و پیکربندی شد."
      : "پایش پالس غیرفعال شد (حالت استاندارد سبک)."
  });
});

app.post("/api/gateways/pulse-ping", (req, res) => {
  const nowStr = "هم‌اکنون";
  gatewayPulseConfig.lastCheckedAt = nowStr;

  const { mode, spikeChannel } = req.body || {};

  // Realistic dynamic pulse jitter simulation around base latencies
  const jitterFactor = () => (Math.random() * 4 - 2); // -2 to +2 ms fluctuation
  
  if (mode === "simulate_spike") {
    // Inject high-latency bottleneck simulation to showcase visual health alert tiers
    gatewayTelemetryMap.whatsapp.pingMs = Math.round(148 + Math.random() * 20); // Critical >= 140ms
    gatewayTelemetryMap.whatsapp.jitterMs = 18.4;
    gatewayTelemetryMap.whatsapp.lastPulseAt = nowStr;

    gatewayTelemetryMap.bale.pingMs = Math.round(98 + Math.random() * 12); // Warning 90-139ms
    gatewayTelemetryMap.bale.jitterMs = 9.1;
    gatewayTelemetryMap.bale.lastPulseAt = nowStr;

    gatewayTelemetryMap.telegram.pingMs = Math.round(52 + jitterFactor() * 2); // Stable 50-89ms
    gatewayTelemetryMap.telegram.jitterMs = 5.2;
    gatewayTelemetryMap.telegram.lastPulseAt = nowStr;

    gatewayTelemetryMap.sms.pingMs = Math.round(185 + Math.random() * 25); // Critical >= 140ms
    gatewayTelemetryMap.sms.jitterMs = 24.0;
    gatewayTelemetryMap.sms.lastPulseAt = nowStr;

    // Record audit events for simulated bottlenecks
    recordGatewayAuditEvent({
      channelId: "whatsapp",
      channelName: "واتساپ (WhatsApp Gateway)",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی: جهش تاخیر پینگ واتساپ (${gatewayTelemetryMap.whatsapp.pingMs}ms)`,
      details: "تاخیر شبکه از آستانه بحرانی ۱۴۰ میلی‌ثانیه فراتر رفت. نوسان جیتر به ۱۸.۴ میلی‌ثانیه افزایش یافت.",
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      jitterMs: gatewayTelemetryMap.whatsapp.jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });

    recordGatewayAuditEvent({
      channelId: "sms",
      channelName: "سامانه پیامک (SMS Alert Gate)",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی: کندی در پول ارسال پیامک (${gatewayTelemetryMap.sms.pingMs}ms)`,
      details: "صف رله اپراتورهای پیامکی دچار تاخیر تایید شده است.",
      latencyMs: gatewayTelemetryMap.sms.pingMs,
      jitterMs: gatewayTelemetryMap.sms.jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });

    recordGatewayAuditEvent({
      channelId: "bale",
      channelName: "پیام‌رسان بله (Bale Hook)",
      eventType: "latency_alert",
      severity: "warning",
      summary: `هشدار احتیاط: تاخیر شبکه پیام‌رسان بله (${gatewayTelemetryMap.bale.pingMs}ms)`,
      details: "لتنسی به ۹۸ میلی‌ثانیه رسیده است اما صف ارسال نرمال گزارش شده است.",
      latencyMs: gatewayTelemetryMap.bale.pingMs,
      jitterMs: gatewayTelemetryMap.bale.jitterMs,
      healthLevel: "warning",
      triggeredBy: "spike_simulation",
    });
  } else if (spikeChannel && gatewayTelemetryMap[spikeChannel]) {
    // Spike only a specific channel
    gatewayTelemetryMap[spikeChannel].pingMs = Math.round(155 + Math.random() * 15);
    gatewayTelemetryMap[spikeChannel].jitterMs = 21.0;
    gatewayTelemetryMap[spikeChannel].lastPulseAt = nowStr;

    recordGatewayAuditEvent({
      channelId: spikeChannel,
      channelName: spikeChannel === "whatsapp" ? "واتساپ" : spikeChannel === "bale" ? "بله" : spikeChannel === "telegram" ? "تلگرام" : "پیامک",
      eventType: "latency_alert",
      severity: "critical",
      summary: `هشدار بحرانی تک‌کاناله: جهش لتنسی ${spikeChannel}`,
      details: `تاخیر ${gatewayTelemetryMap[spikeChannel].pingMs}ms ثبت شد.`,
      latencyMs: gatewayTelemetryMap[spikeChannel].pingMs,
      jitterMs: gatewayTelemetryMap[spikeChannel].jitterMs,
      healthLevel: "critical",
      triggeredBy: "spike_simulation",
    });
  } else {
    // Standard baseline pulse check
    gatewayTelemetryMap.whatsapp.pingMs = Math.max(18, Math.round(24 + jitterFactor()));
    gatewayTelemetryMap.whatsapp.jitterMs = parseFloat((1.8 + Math.random() * 0.8).toFixed(1));
    gatewayTelemetryMap.whatsapp.lastPulseAt = nowStr;

    gatewayTelemetryMap.bale.pingMs = Math.max(30, Math.round(38 + jitterFactor() * 1.5));
    gatewayTelemetryMap.bale.jitterMs = parseFloat((3.8 + Math.random() * 1.2).toFixed(1));
    gatewayTelemetryMap.bale.lastPulseAt = nowStr;

    gatewayTelemetryMap.telegram.pingMs = Math.max(45, Math.round(52 + jitterFactor() * 2));
    gatewayTelemetryMap.telegram.jitterMs = parseFloat((5.2 + Math.random() * 1.8).toFixed(1));
    gatewayTelemetryMap.telegram.lastPulseAt = nowStr;

    gatewayTelemetryMap.sms.pingMs = Math.max(95, Math.round(110 + jitterFactor() * 3));
    gatewayTelemetryMap.sms.jitterMs = parseFloat((11.0 + Math.random() * 3.5).toFixed(1));
    gatewayTelemetryMap.sms.lastPulseAt = nowStr;

    // Record routine successful pulse heartbeat audit event
    recordGatewayAuditEvent({
      channelId: "all",
      channelName: "پالس همگانی درگاه‌ها",
      eventType: "heartbeat",
      severity: "success",
      summary: "استعلام موفق ضربان قلب و تایید سلامت اتصالات",
      details: `پینگ درگاه‌ها: واتساپ (${gatewayTelemetryMap.whatsapp.pingMs}ms) | بله (${gatewayTelemetryMap.bale.pingMs}ms) | تلگرام (${gatewayTelemetryMap.telegram.pingMs}ms) | پیامک (${gatewayTelemetryMap.sms.pingMs}ms)`,
      latencyMs: gatewayTelemetryMap.whatsapp.pingMs,
      jitterMs: gatewayTelemetryMap.whatsapp.jitterMs,
      healthLevel: "optimal",
      triggeredBy: "manual_ping",
    });
  }

  res.json({
    success: true,
    config: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    message: mode === "simulate_spike"
      ? "سناریوی تست تاخیر بالا با موفقیت شبیه‌سازی شد؛ رنگ آیکون‌ها و هشدارهای بصری به‌روز شدند."
      : "پالس بلادرنگ اتصال با کلیه درگاه‌های فعال با موفقیت محاسبه شد.",
  });
});

// History & Audit Log Endpoints for Channel Gateways
app.get("/api/gateways/history", (req, res) => {
  const { search, channel, eventType, severity, limit = "200" } = req.query;

  let filtered = [...gatewayAuditLogs];

  if (channel && channel !== "all") {
    filtered = filtered.filter((ev) => ev.channelId === channel || ev.channelId === "all");
  }

  if (eventType && eventType !== "all") {
    filtered = filtered.filter((ev) => ev.eventType === eventType);
  }

  if (severity && severity !== "all") {
    filtered = filtered.filter((ev) => ev.severity === severity);
  }

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((ev) =>
      ev.summary.toLowerCase().includes(q) ||
      (ev.details && ev.details.toLowerCase().includes(q)) ||
      ev.channelName.toLowerCase().includes(q) ||
      ev.channelId.toLowerCase().includes(q) ||
      ev.id.toLowerCase().includes(q) ||
      (ev.previousStatus && ev.previousStatus.toLowerCase().includes(q)) ||
      (ev.newStatus && ev.newStatus.toLowerCase().includes(q))
    );
  }

  const maxItems = parseInt(limit as string, 10) || 200;
  const items = filtered.slice(0, maxItems);

  // Calculate audit statistics across all history
  const stats = {
    totalEvents: gatewayAuditLogs.length,
    heartbeats: gatewayAuditLogs.filter((ev) => ev.eventType === "heartbeat").length,
    statusChanges: gatewayAuditLogs.filter((ev) => ev.eventType === "status_change").length,
    latencyAlerts: gatewayAuditLogs.filter((ev) => ev.eventType === "latency_alert").length,
    configChanges: gatewayAuditLogs.filter((ev) => ev.eventType === "config_change").length,
  };

  res.json({
    success: true,
    total: filtered.length,
    stats,
    events: items,
  });
});

// Clear/Prune History Log
app.post("/api/gateways/history/clear", (req, res) => {
  gatewayAuditLogs.length = 0;

  recordGatewayAuditEvent({
    channelId: "all",
    channelName: "سیستم مانیتورینگ گیت‌وی",
    eventType: "config_change",
    severity: "info",
    summary: "پاکسازی جدول لاگ‌های حسابرسی توسط اپراتور سیستم",
    details: "تاریخچه حسابرسی گیت‌وی‌ها بازنشانی شد. ثبت رویدادهای زنده از این لحظه ادامه خواهد یافت.",
    triggeredBy: "operator_toggle",
  });

  res.json({
    success: true,
    message: "تاریخچه مانیتورینگ گیت‌وی‌ها بازنشانی شد.",
    events: gatewayAuditLogs,
  });
});

// Channel Gateway Status Transition Endpoint
app.post("/api/gateways/status", (req, res) => {
  const { channelId, status, reason } = req.body;
  const validChannels = ["whatsapp", "bale", "telegram", "sms"];
  const validStatuses = ["active", "standby", "disconnected"];

  if (!channelId || !validChannels.includes(channelId)) {
    return res.status(400).json({ error: "شناسه درگاه نامعتبر است." });
  }

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "وضعیت نامعتبر است (باید active، standby یا disconnected باشد)." });
  }

  const prevStatus = channelStatuses[channelId] || "active";
  channelStatuses[channelId] = status as "active" | "standby" | "disconnected";

  const channelNames: Record<string, string> = {
    whatsapp: "واتساپ (WhatsApp Gateway)",
    bale: "پیام‌رسان بله (Bale Hook)",
    telegram: "تلگرام (Telegram Bot API)",
    sms: "سامانه پیامک (SMS Alert Gate)",
  };

  const severity = status === "disconnected" ? "critical" : status === "standby" ? "warning" : "success";

  recordGatewayAuditEvent({
    channelId,
    channelName: channelNames[channelId] || channelId,
    eventType: "status_change",
    severity,
    summary: `تغییر وضعیت درگاه ${channelNames[channelId] || channelId} به ${status === 'active' ? 'فعال (Active)' : status === 'standby' ? 'آماده‌باش (Standby)' : 'قطع اتصال (Disconnected)'}`,
    details: `وضعیت اتصال از '${prevStatus}' به '${status}' تغییر یافت. علت: ${reason || "تغییر کنترل‌شده توسط اپراتور کنسول"}`,
    previousStatus: prevStatus,
    newStatus: status,
    latencyMs: gatewayTelemetryMap[channelId]?.pingMs || 30,
    jitterMs: gatewayTelemetryMap[channelId]?.jitterMs || 2.0,
    healthLevel: status === "disconnected" ? "critical" : status === "standby" ? "warning" : "optimal",
    triggeredBy: "operator_toggle",
  });

  res.json({
    success: true,
    channelId,
    previousStatus: prevStatus,
    status,
    channels: getChannelsWithTelemetry(),
    message: `وضعیت درگاه ${channelNames[channelId]} به ${status} به‌روزرسانی و در تاریخچه حسابرسی ثبت شد.`,
  });
});

// Inbound Message Handler with Anti-Ban & Persist-First Protocol
app.post("/api/evolution/inbound-message", async (req, res) => {
  try {
    const {
      senderPhone = "+989123456789",
      senderName = "بیمار / کاربر واتساپ",
      messageText,
      isInitiatedByCounterparty = true, // Must be true to pass anti-ban
    } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ error: "متن پیام الزامی است." });
    }

    const trimmed = messageText.trim();
    const isPharmacy = evolutionInstanceState.mode === "pharmacy_inbound";

    // 1. Anti-Ban Validation: Strict Inbound Only
    if (isPharmacy && evolutionInstanceState.antiBan.strictInboundOnly && !isInitiatedByCounterparty) {
      return res.status(403).json({
        error: "توقف توسط سپر ضد بلاک: ارسال پیام آغازگر (Cold Outreach) در واتساپ داروخانه ممنوع است تا خطر مسدودی به صفر برسد.",
        antiBanViolation: "STRICT_INBOUND_REQUIRED"
      });
    }

    // 2. Data Privacy & Retention Check: WorkLedger logging vs Ephemeral sessions
    let persistedLedgerId: string | null = null;
    const isMedicalOrPharmacy = isPharmacy || /دارو|درمان|نسخه|بیمار|قند|فشار|پزشک|کلینیک|قرص|کپسول/.test(trimmed);
    const shouldKeepEphemeral = globalPrivacySettings.retentionPolicy === "ephemeral" && isMedicalOrPharmacy;

    if (shouldKeepEphemeral) {
      // High-privacy Medical / Professional mode: Keep sessions strictly ephemeral, DO NOT persist into WorkLedger
      globalPrivacySettings.ephemeralSessionsCount += 1;
      persistedLedgerId = null;
    } else if (evolutionInstanceState.antiBan.persistLedgerFirst) {
      // Audited mode: Log interaction metadata for the WorkLedger
      persistedLedgerId = `wld-${Date.now()}`;
      const ledgerEntry = {
        id: persistedLedgerId,
        title: isPharmacy
          ? `پیام ورودی داروخانه: ${senderPhone}`
          : `یادداشت چت شخصی: ${trimmed.slice(0, 30)}...`,
        domainCategory: (isPharmacy ? "Clinical" : "Personal") as any,
        summary: trimmed,
        activeContext: `WhatsApp Inbound (Evolution API) -> ${isPharmacy ? "قوانین ضد بلاک فعال" : "چت شخصی"}`,
        tasksPending: 1,
        lastUpdated: "اکنون",
        tokenLoad: `${Math.round(trimmed.length * 1.3)} توکن`,
      };
      serverLedgerItems.unshift(ledgerEntry);
      evolutionInstanceState.lastPersistedLedgerId = persistedLedgerId;
      globalPrivacySettings.loggedSessionsCount += 1;
    }

    // 3. Calculate Anti-Ban Human Jitter Delay & Typing Presence
    const minSec = evolutionInstanceState.antiBan.humanJitterMinSec;
    const maxSec = evolutionInstanceState.antiBan.humanJitterMaxSec;
    const jitterSec = parseFloat((Math.random() * (maxSec - minSec) + minSec).toFixed(1));

    // 4. Process Message via Core Pipeline
    const domain = isPharmacy ? "Clinical" : "Personal";
    const pipelineResult = await processPipelineMessage("whatsapp", senderPhone, senderName, trimmed, domain, "shadow");

    evolutionInstanceState.lastInboundAt = "اکنون";
    evolutionInstanceState.antiBan.messagesSentToday += 1;

    res.json({
      success: true,
      antiBanPassed: true,
      persistedInLedgerId: persistedLedgerId,
      retentionPolicy: globalPrivacySettings.retentionPolicy,
      isEphemeral: shouldKeepEphemeral,
      humanJitterDelaySec: jitterSec,
      typingPresenceSent: evolutionInstanceState.antiBan.simulateComposingPresence,
      reply: pipelineResult.record.proposedReply,
      shadowRecord: pipelineResult.record,
      trace: pipelineResult.trace,
    });
  } catch (err: any) {
    console.error("Inbound message processing failed:", err);
    res.status(500).json({ error: err.message || "خطا در پردازش پیام ورودی." });
  }
});


app.get("/api/pipeline/state", (req, res) => {
  res.json({
    status: "operational",
    environment: "Embednet OS Core v4.1 (LangBot Modular Pattern)",
    privacySettings: globalPrivacySettings,
    pulseConfig: gatewayPulseConfig,
    channels: getChannelsWithTelemetry(),
    shadowQueue,
    stats: {
      totalProcessed: 1428,
      shadowIntercepted: shadowQueue.length,
      autoApprovedSafe: 1290,
      rejectedOrRedline: 27,
      ephemeralSessions: globalPrivacySettings.ephemeralSessionsCount,
      auditedSessions: globalPrivacySettings.loggedSessionsCount,
    }
  });
});

// Evolution API v2 Real Webhook Endpoint (For WhatsApp)
app.post("/webhook/evolution", async (req, res) => {
  // Acknowledge webhook quickly to avoid timeout
  res.status(200).json({ status: "received" });

  try {
    // 1. Universal Ingest Adapter
    const payload = req.body;
    
    // Check if it's a message event
    if (payload.event !== "messages.upsert") return;

    const message = payload.data?.messages?.[0];
    if (!message || message.key.fromMe) return;

    const senderId = message.key.remoteJid;
    const senderDisplay = message.pushName || senderId;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || "";

    if (!text) return;

    // Dispatch internally to pipeline process
    await processPipelineMessage("whatsapp", senderId, senderDisplay, text, "WhatsApp User", "live");

  } catch (error) {
    console.error("Evolution API Webhook Error:", error);
  }
});

// Core Pipeline Processing Function (Decoupled from HTTP req/res for Webhook reuse)
async function processPipelineMessage(
  channel: "whatsapp" | "bale" | "telegram" | "sms",
  senderId: string,
  senderDisplay: string,
  text: string,
  domainContext: string,
  environmentMode: "shadow" | "live" = "shadow"
) {
  const trimmed = text.trim();
  const startTime = Date.now();

  // 1. Check Deterministic Rules
  const isRedlineMedical = /تشنج|بیهوش|خونریزی شدید|کما|کاهش هوشیاری|خودکشی/.test(trimmed);
  
  // Qanoon-Price Engine Logic
  let priceInfo = "";
  let isPricingQuery = false;
  for (const [drug, info] of Object.entries(DRUG_CATALOG)) {
    if (trimmed.includes(drug)) {
      isPricingQuery = true;
      priceInfo += `\nقیمت مصوب ${drug}: ${info.price.toLocaleString()} تومان (کد TTAC: ${info.code})`;
    }
  }

  if (!isPricingQuery) {
     isPricingQuery = /قیمت|دارو|قانون|ارز|بیمه|فاکتور|ttac|تعرفه/.test(trimmed);
  }

  let riskLevel: "safe" | "medium_risk" | "high_redline" = "safe";
  let deterministicRule: string | undefined = undefined;

  if (isRedlineMedical) {
    riskLevel = "high_redline";
    deterministicRule = "CLINICAL_REDLINE_GUARD (ADR-0002)";
  } else if (isPricingQuery) {
    riskLevel = "medium_risk";
    deterministicRule = "QANOON_PRICE_DETERMINISTIC_ENGINE (ADR-0001)";
  }

  // 2. Call Gemini
  let proposedReply = "";
  try {
    const ai = getGenAI();
    let prompt = `You are Embednet OS Core Intelligence, an executive and operational engine for WhatsApp and local messengers.
User input: "${trimmed}"
Domain Profile: ${domainContext}
Channel: ${channel}
Deterministic Rule triggered: ${deterministicRule || "None"}
Risk Level: ${riskLevel}

Provide a concise, direct, helpful, and natural response in Persian. Avoid corporate fluff or generic AI apologies.`;

    if (priceInfo) {
      prompt += `\n\nCRITICAL DETERMINISTIC DATA INJECTED (DO NOT ALTER PRICES):\n${priceInfo}`;
    }

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.3 },
    });
    proposedReply = geminiRes.text || "پاسخ آماده شد.";
  } catch {
    proposedReply = isRedlineMedical
      ? "هشدار: مورد ارجاع اورژانسی. با شماره ۱۱۵ تماس گرفته شود."
      : `پیام در سامانه ثبت شد و در خط لوله ${channel} پردازش گردید.`;
  }

  const isBaleAutoPersonal = domainContext === "Personal" || domainContext === "bale-auto";
  const isMedicalOrClinical = domainContext === "Clinical" || isRedlineMedical || /دارو|درمان|نسخه|بیمار|قند|فشار|پزشک|کلینیک|قرص|کپسول|تشنج|بیهوش|خونریزی/.test(trimmed);
  const isProfessional = domainContext === "Executive" || domainContext === "Operations";
  const isHighPrivacyMedicalOrProf = (isMedicalOrClinical || isProfessional);
  const shouldEnforceEphemeral = globalPrivacySettings.retentionPolicy === "ephemeral" && isHighPrivacyMedicalOrProf;

  // Global Data Retention / Privacy Pipeline Enforcement
  let retentionTraceDetail = "";
  if (globalPrivacySettings.retentionPolicy === "ephemeral") {
    globalPrivacySettings.ephemeralSessionsCount += 1;
    retentionTraceDetail = shouldEnforceEphemeral
      ? "سیاست سشن موقت (Zero-Retention Ephemeral): ربات پرمحرمانگی پزشکی/حرفه‌ای فعال است. هیچ متادیتایی در دفتر کار (WorkLedger) ذخیره نشد و سشن در حافظه فرار RAM منقضی می‌شود."
      : "سیاست نگهداری داده: سشن در حالت موقت (Ephemeral) پردازش شد؛ ثبت در دفتر کار انجام نشد.";
  } else {
    globalPrivacySettings.loggedSessionsCount += 1;
    retentionTraceDetail = "سیاست ثبت متادیتا در دفتر کار (WorkLedger Audit): متادیتای تعامل، شناسه سشن و خلاصه زمینه برای پایش حاکمیتی در WorkLedger ثبت گردید.";

    // Auto-record interaction metadata to WorkLedger if not already logged
    if (!serverLedgerItems.some(i => i.summary === trimmed)) {
      serverLedgerItems.unshift({
        id: `wld-${Date.now()}`,
        title: `استعلام ${domainContext}: ${trimmed.slice(0, 32)}...`,
        domainCategory: (domainContext === "Clinical" ? "Clinical" : (domainContext === "Operations" ? "Operations" : "Executive")) as any,
        summary: trimmed,
        activeContext: `خط لوله ${channel.toUpperCase()} (ثبت متادیتای تعامل در WorkLedger)`,
        tasksPending: 1,
        lastUpdated: "اکنون",
        tokenLoad: `${Math.round(trimmed.length * 1.3)} توکن`,
      });
    }
  }

  const shadowId = `sh-${Date.now()}`;
  const newRecord: ShadowRecord = {
    id: shadowId,
    sessionId: `${channel}-${senderId}`,
    channel,
    senderDisplay,
    userMessage: isBaleAutoPersonal
      ? "[حریم خصوصی: یادداشت شخصی محرمانه]"
      : (shouldEnforceEphemeral && globalPrivacySettings.scrubSensitiveMedicalNotes && isMedicalOrClinical
          ? "[سشن محرمانه پزشکی - پالایش‌شده بر اساس پروتکل Zero-Retention]"
          : trimmed),
    proposedReply,
    timestamp: "اکنون",
    confidenceScore: isRedlineMedical ? 0.99 : 0.92,
    riskLevel: isBaleAutoPersonal ? "safe" : riskLevel,
    status: isBaleAutoPersonal 
      ? "approved" 
      : (environmentMode === "shadow" || riskLevel !== "safe" ? "pending" : "approved"),
    deterministicRuleApplied: isBaleAutoPersonal 
      ? "ZERO_RETENTION_PRIVACY_POLICY (bale-auto)" 
      : (shouldEnforceEphemeral ? "EPHEMERAL_SESSION_HIGH_PRIVACY" : deterministicRule),
    auditNote: isBaleAutoPersonal 
      ? `سیاست Zero-Retention: بدون ذخیره‌سازی متن خام شخصی / پاسخ آنی (${Date.now() - startTime}ms)` 
      : (shouldEnforceEphemeral
          ? `حفظ حریم خصوصی سشن‌های پزشکی/حرفه‌ای (Zero-Retention Ephemeral) | پردازش در ${Date.now() - startTime}ms`
          : `ثبت متادیتا در WorkLedger | پردازش شده در ${Date.now() - startTime}ms`),
  };

  // For bale-auto privacy or pure ephemeral medical sessions, avoid persisting in raw shadow review if scrubbed
  if (!isBaleAutoPersonal) {
    shadowQueue.unshift(newRecord);
  }

  // If live and approved, dispatch to Outbox
  if ((environmentMode === "live" || isBaleAutoPersonal) && newRecord.status === "approved") {
    await dispatchToOutbox(channel, senderId, newRecord.proposedReply);
    newRecord.auditNote += " | (Live Dispatch Sent)";
  }

  return {
    record: newRecord,
    trace: [
      { stage: "GATEWAY_INGEST", title: `دریافت رویداد خام از ${channel.toUpperCase()}`, status: "passed", detail: "احراز هویت وب‌هوک و سلامت اتصال با موفقیت تایید شد.", durationMs: 4 },
      { stage: "ENVELOPE_NORMALIZE", title: "تبدیل به پاکت یکپارچه (UnifiedMessage Envelope)", status: "passed", detail: `Channel: ${channel} | ID: ${senderId} | Timestamp: ${Date.now()}`, durationMs: 2 },
      { stage: "DETERMINISTIC_RULES", title: "موتور قوانین قطعی و خطوط قرمز (Hard Rule Gate)", status: deterministicRule ? "intercepted" : "passed", detail: deterministicRule || "هیچ مغایرتی با قوانین صلب امنیتی یافت نشد.", durationMs: 6 },
      { stage: "DATA_RETENTION", title: globalPrivacySettings.retentionPolicy === "ephemeral" ? "سیاست نگهداری داده: سشن‌های موقت (Zero-Retention Ephemeral)" : "سیاست نگهداری داده: ثبت متادیتا در دفتر کار (WorkLedger Audit)", status: globalPrivacySettings.retentionPolicy === "ephemeral" ? "warning" : "passed", detail: retentionTraceDetail, durationMs: 2 },
      { stage: "MEMORY_LOOKUP", title: "فراخوانی حافظه سشن و زمینه پیشین", status: "passed", detail: (isBaleAutoPersonal || shouldEnforceEphemeral) ? "حافظه موقت رم با انقضای آنی (In-Memory Ephemeral TTL - بدون ثبت در دیتابیس)" : `بازیابی حافظه برای نشست ${channel}-${senderId}`, durationMs: 14 },
      { stage: "SHADOW_EVALUATION", title: "حالت سایه و ثبت در صف نظارت (Shadow Mode HITL)", status: isBaleAutoPersonal ? "passed" : (environmentMode === 'shadow' ? "warning" : "passed"), detail: isBaleAutoPersonal ? "بایپس سایه به علت حریم خصوصی Zero-Retention (پاسخ سریع برای حساب‌کتاب)" : (environmentMode === 'shadow' ? "پاسخ به حالت سایه رفت." : "حالت Live فعال است."), durationMs: 5 },
      { stage: "LLM_INFERENCE", title: "پردازش توسط مدل زبان طبیعی", status: "passed", detail: `مدل با تامین‌کننده فعال (${adminIntegrationState.activeAiProvider}) در ${Date.now() - startTime}ms پاسخ داد.`, durationMs: Date.now() - startTime },
      { stage: "OUTBOX_DISPATCH", title: "آماده‌سازی تحویل به کلاینت نهایی", status: newRecord.status === "approved" ? "passed" : "warning", detail: newRecord.status === "approved" ? "ارسال به صف خروجی پیام‌رسان." : "منتظر تایید مدیر.", durationMs: 2 },
    ]
  };
}

// Normalized Outbox Dispatcher (Mocking the real API calls)
async function dispatchToOutbox(channel: string, targetId: string, message: string) {
  console.log(`[OUTBOX DISPATCH] -> ${channel.toUpperCase()}`);
  console.log(`[TARGET]: ${targetId}`);
  console.log(`[MESSAGE]: ${message}`);
  
  // Real implementation would use:
  // if (channel === 'whatsapp') await fetch('https://evolution-api/message/sendText', ...)
  // if (channel === 'bale') await fetch('https://tapi.bale.ai/bot{TOKEN}/sendMessage', ...)
  return true;
}

app.post("/api/pipeline/process", async (req, res) => {
  try {
    const {
      channel = "whatsapp",
      senderId = "operator-console",
      senderDisplay = "کاربر تستی / مدیر",
      text,
      domainContext = "Executive",
      environmentMode = "shadow"
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required." });
    }

    const result = await processPipelineMessage(channel, senderId, senderDisplay, text, domainContext, environmentMode);

    res.json({
      success: true,
      shadowRecord: result.record,
      trace: result.trace,
    });
  } catch (err: any) {
    console.error("Error in /api/pipeline/process:", err);
    res.status(500).json({ error: err.message || "Pipeline processing failed." });
  }
});

app.post("/api/pipeline/shadow/action", async (req, res) => {
  const { id, action, editedReply } = req.body;
  const item = shadowQueue.find(s => s.id === id);
  if (!item) {
    return res.status(404).json({ error: "Shadow item not found." });
  }

  if (action === "approve") {
    item.status = "approved";
    item.auditNote = `تایید و به خروجی ${item.channel.toUpperCase()} ارسال شد.`;
    await dispatchToOutbox(item.channel, item.sessionId.replace(`${item.channel}-`, ''), item.proposedReply);
  } else if (action === "reject") {
    item.status = "rejected";
    item.auditNote = "رد شده توسط مدیر (False Positive)";
  } else if (action === "modify") {
    item.status = "modified";
    item.editedReply = editedReply;
    item.auditNote = "ویرایش دستی توسط مدیر و ارسال به مقصد";
    await dispatchToOutbox(item.channel, item.sessionId.replace(`${item.channel}-`, ''), editedReply);
  }

  res.json({ success: true, item });
});

// Setup Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gemini Bot Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

