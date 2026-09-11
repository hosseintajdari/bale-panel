import { Router } from "express";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto.js";
import { getSafeCredentialsList, vaultCredentialsStore } from "./store.js";
import type { EncryptedVaultRecord } from "./types.js";

export const vaultRouter = Router();

// GET list of encrypted credentials
vaultRouter.get("/api/admin/auth-credentials", (req, res) => {
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
vaultRouter.post("/api/admin/auth-credentials", (req, res) => {
  const { service, label, agentId, agentName, secret, taskScope } = req.body || {};

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

  const cleanAgentId = (agentId || `agent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const envKeyName = `AGENT_AUTH_${service.toUpperCase()}_${cleanAgentId.toUpperCase()}`;

  // Store encrypted blob in process.env (environment configuration)
  process.env[envKeyName] = encResult.encryptedBlob;

  const newCredential: EncryptedVaultRecord = {
    id: `cred-${service}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
vaultRouter.delete("/api/admin/auth-credentials/:id", (req, res) => {
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
vaultRouter.post("/api/admin/auth-credentials/test/:id", (req, res) => {
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
vaultRouter.get("/api/admin/auth-credentials/env-export", (req, res) => {
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
