import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ quiet: true });

export const PORT = parseInt(process.env.PORT || "3001", 10);
export const PANEL_API_SECRET = process.env.PANEL_API_SECRET || "";
export const VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY || "";
export const BALE_BOT_TOKEN = process.env.BALE_BOT_TOKEN?.trim() || "";
export const BALE_WEBHOOK_SECRET = process.env.BALE_WEBHOOK_SECRET?.trim() || "";
export function getBaleWebhookSecret(): string {
  return process.env.BALE_WEBHOOK_SECRET?.trim() || "";
}
// Configure this as a custom `x-evolution-webhook-secret` header on the
// Evolution instance webhook. The endpoint rejects all traffic when absent.
export const EVOLUTION_WEBHOOK_SECRET = process.env.EVOLUTION_WEBHOOK_SECRET?.trim() || "";

export function validateStartupEnv(): void {
  const REQUIRED_ENV: string[] = ["VAULT_MASTER_KEY", "PANEL_API_SECRET"];
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]?.trim());
  if (missingEnv.length > 0) {
    console.error(
      `\n[FATAL] Missing required environment variables: ${missingEnv.join(", ")}\n` +
      `Copy .env.example to .env and fill in all required values.\n`
    );
    process.exit(1);
  }
}

// Lazy initialize Gemini client
export function getGenAI(): GoogleGenAI {
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
