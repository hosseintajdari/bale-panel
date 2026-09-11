import { encryptSecret, maskSecret } from "./crypto.js";
import type { EncryptedVaultRecord } from "./types.js";

export const vaultCredentialsStore: EncryptedVaultRecord[] = [];

export function seedFromEnv(
  service: "github" | "notion" | "openai",
  envKey: string,
  label: string,
  agentId: string,
  agentName: string,
  taskScope: string
): void {
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

// Seed initial credentials from environment if present
seedFromEnv(
  "github",
  "GITHUB_TOKEN",
  "GitHub Token - همگام‌سازی مخزن هسته",
  "agent-devops",
  "دستیار کدنویسی و DevOps",
  "همگام‌سازی خودکار برنچ‌ها و Pull Requestها"
);
seedFromEnv(
  "notion",
  "NOTION_API_KEY",
  "Notion Secret - پایگاه اسناد و Work Ledger",
  "agent-ledger",
  "ایجنت مستندسازی و وظایف",
  "ثبت خودکار سشن‌های کاری و یادداشت‌های راهبردی"
);
seedFromEnv(
  "openai",
  "OPENAI_API_KEY",
  "OpenAI API Key - استدلال پشتیبان",
  "agent-reasoning",
  "ایجنت استدلال عمیق و فال‌بک",
  "تولید امبدینگ و استدلال تحلیلی برای سناریوهای مرزی"
);

// Safe DTO: strip encryptedBlob when returning to client
export function getSafeCredentialsList(): Array<Omit<EncryptedVaultRecord, "encryptedBlob">> {
  return vaultCredentialsStore.map(({ encryptedBlob, ...safe }) => safe);
}
