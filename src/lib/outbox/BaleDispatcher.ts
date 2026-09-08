import axios from "axios";

const BALE_API_BASE = "https://tapi.bale.ai";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BaleSendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export class BaleDispatcher {
  private token: string;
  private apiBase: string;

  constructor(token: string) {
    if (!token || !token.trim()) {
      throw new Error("[BaleDispatcher] BALE_BOT_TOKEN is required.");
    }
    this.token = token.trim();
    this.apiBase = `${BALE_API_BASE}/bot${this.token}`;
  }

  async sendText(chatId: string, text: string): Promise<BaleSendResult> {
    return this.withRetry(async () => {
      const response = await axios.post<any>(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      });
      if (response.data?.ok) {
        return { ok: true, messageId: response.data.result?.message_id as number | undefined };
      }
      return { ok: false, error: (response.data?.description as string) || "Unknown Bale API error" };
    });
  }

  async sendReply(chatId: string, text: string, replyToMessageId: number): Promise<BaleSendResult> {
    return this.withRetry(async () => {
      const response = await axios.post<any>(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_to_message_id: replyToMessageId,
      });
      if (response.data?.ok) {
        return { ok: true, messageId: response.data.result?.message_id as number | undefined };
      }
      return { ok: false, error: (response.data?.description as string) || "Bale API error" };
    });
  }

  async sendTyping(chatId: string): Promise<void> {
    try {
      await axios.post(`${this.apiBase}/sendChatAction`, { chat_id: chatId, action: "typing" });
    } catch { /* best-effort */ }
  }

  async healthCheck(): Promise<{ ok: boolean; botName?: string; botUsername?: string }> {
    try {
      const response = await axios.get<any>(`${this.apiBase}/getMe`, { timeout: 5000 });
      if (response.data?.ok) {
        return { ok: true, botName: response.data.result?.first_name as string, botUsername: response.data.result?.username as string };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    try {
      const payload: Record<string, any> = { url: webhookUrl };
      if (secretToken) payload.secret_token = secretToken;
      const response = await axios.post<any>(`${this.apiBase}/setWebhook`, payload);
      return response.data?.ok === true;
    } catch { return false; }
  }

  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await axios.post<any>(`${this.apiBase}/deleteWebhook`);
      return response.data?.ok === true;
    } catch { return false; }
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try { return await fn(); }
      catch (err: any) {
        lastError = err as Error;
        if (err?.response?.status >= 400 && err?.response?.status < 500) throw err;
        if (attempt < retries) {
          console.warn(`[BaleDispatcher] Retry ${attempt}/${retries}:`, (err as Error).message);
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw lastError ?? new Error("BaleDispatcher: max retries exceeded");
  }
}

let _baleDispatcher: BaleDispatcher | null = null;

export function getBaleDispatcher(): BaleDispatcher | null {
  const token = process.env.BALE_BOT_TOKEN;
  if (!token) return null;
  if (!_baleDispatcher) _baleDispatcher = new BaleDispatcher(token);
  return _baleDispatcher;
}
