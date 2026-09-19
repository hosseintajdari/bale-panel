import { Router } from "express";
import { sessionDB } from "../../lib/db/database.js";
import { getGenAI } from "../config.js";

export const botRouter = Router();

// Health check endpoint
botRouter.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: AI Productive Note Expander & Structurer
botRouter.post("/api/notes/structure", async (req, res) => {
  try {
    const {
      rawInput,
      platform = "telegram",
      activeStage = "STAGE_CAPTURE",
    } = req.body || {};

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
    rawText = rawText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

    const parsed = JSON.parse(rawText);

    const structuredNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: parsed.title || "Structured Note",
      rawInput: rawInput.trim(),
      category: parsed.category || "General",
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["#Notes"],
      summary: parsed.summary || "Structured note summary.",
      expandedContent: parsed.expandedContent || parsed.summary || rawInput,
      actionItems: (parsed.actionItems || []).map((act: any, idx: number) => ({
        id: `act-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
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
botRouter.post("/api/memory/query", async (req, res) => {
  try {
    const { query, activeStage = "STAGE_CAPTURE" } = req.body || {};
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
botRouter.post("/api/bot/chat", async (req, res) => {
  try {
    const {
      sessionId = "default-session",
      platform = "telegram",
      message,
      imageBase64,
      imageMimeType = "image/jpeg",
      systemInstruction = "You are a friendly, intelligent assistant running on Telegram and WhatsApp powered by Google Gemini.",
      temperature = 0.7,
      enableTools = false,
    } = req.body || {};

    if (!message && !imageBase64) {
      return res.status(400).json({ error: "Message or image is required." });
    }

    const tenantId = (req.headers["x-tenant-id"] as string) || req.body?.tenantId || "default";

    // Persist inbound user message
    sessionDB.addMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      tenantId,
      role: "user",
      content: message || "[Sent an image]",
      image: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    // Build context history from SQLite
    const allSessionMsgs = sessionDB.getMessages(sessionId, tenantId);
    const history = allSessionMsgs.slice(-10); // Keep last 10 exchanges for context

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

    // Persist bot model response
    sessionDB.addMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      tenantId,
      role: "model",
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    const updatedHistory = sessionDB.getMessages(sessionId, tenantId);

    res.json({
      reply: replyText,
      sessionId,
      history: updatedHistory,
    });
  } catch (error: any) {
    console.error("Error in /api/bot/chat:", error);
    res.status(500).json({
      error: error.message || "Failed to generate bot response with Gemini.",
    });
  }
});

// Clear session history
botRouter.post("/api/bot/clear", (req, res) => {
  const { sessionId = "default-session", tenantId = "default" } = req.body || {};
  sessionDB.clearSession(sessionId, tenantId);
  res.json({ success: true, message: `Session ${sessionId} (tenant: ${tenantId}) reset.` });
});

// Get list of recent bot/pipeline sessions
botRouter.get("/api/sessions/overview", (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] as string) || "default";
  const sessions = sessionDB.listRecentSessions(tenantId);
  res.json({ success: true, sessions });
});

// Custom Node.js Bot Code Generator with Gemini
botRouter.post("/api/generate-bot-code", async (req, res) => {
  try {
    const {
      platform = "telegram",
      framework = "telegraf",
      botType = "customer-support",
      customRequirements = "",
      features = ["session-memory", "vision-images", "system-prompts"],
    } = req.body || {};

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
