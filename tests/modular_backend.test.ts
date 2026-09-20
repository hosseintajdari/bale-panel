import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../server.js";
import { evaluateDeterministicRules, DRUG_CATALOG } from "../src/server/rules/index.js";
import { encryptSecret, decryptSecret, maskSecret, vaultCredentialsStore, getSafeCredentialsList } from "../src/server/vault/index.js";
import { authenticateToken, secureEquals, hashToken, createOperatorSession, sessionUser, operatorSessions } from "../src/server/auth/index.js";
import { shadowDB, auditDB, apiKeyDB, telegramKeyboardDB, telegramWebAppDB } from "../src/lib/db/database.js";
import { dispatchToOutbox } from "../src/server/outbox/index.js";
import { processPipelineMessage } from "../src/server/pipeline/index.js";
import { PANEL_API_SECRET, BALE_WEBHOOK_SECRET } from "../src/server/config.js";

// Ensure mock outbox dispatcher is active during automated test runs
process.env.MOCK_OUTBOX = "true";

// Helper to make HTTP requests against express app
function request(
  server: http.Server,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as any;
    const port = address.port;
    const postData = options.body ? JSON.stringify(options.body) : "";

    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (options.body) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: options.method,
        path: options.path,
        headers: reqHeaders,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // keep raw string if not json
          }
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

test("Modular Backend Test Suite", async (t) => {
  // Start server on ephemeral port for tests
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, "127.0.0.1", () => resolve()));

  t.after(() => {
    testServer.close();
  });

  await t.test("1. Rules Engine: Deterministic Rules & Redlines", async () => {
    // Redline 1: تشنج
    const r1 = evaluateDeterministicRules("بیمار دچار تشنج شده است");
    assert.equal(r1.isRedlineMedical, true);
    assert.equal(r1.riskLevel, "high_redline");
    assert.equal(r1.deterministicRule, "CLINICAL_REDLINE_GUARD (ADR-0002)");

    // Redline 2: خودکشی
    const r2 = evaluateDeterministicRules("احساس خودکشی دارم");
    assert.equal(r2.isRedlineMedical, true);
    assert.equal(r2.riskLevel, "high_redline");

    // Pricing: کوآموکسی کلاو
    const p1 = evaluateDeterministicRules("قیمت داروی کوآموکسی کلاو چقدر است؟");
    assert.equal(p1.isPricingQuery, true);
    assert.equal(p1.riskLevel, "medium_risk");
    assert.equal(p1.deterministicRule, "QANOON_PRICE_DETERMINISTIC_ENGINE (ADR-0001)");
    assert.ok(p1.priceInfo.includes("58,200"));
    assert.ok(p1.priceInfo.includes("IRC-10293"));

    // Pricing: استامینوفن
    const p2 = evaluateDeterministicRules("استامینوفن ساده");
    assert.equal(p2.isPricingQuery, true);
    assert.ok(p2.priceInfo.includes("12,000"));

    // Safe query
    const s1 = evaluateDeterministicRules("سلام چطوری؟ وضعیت سیستم چیه؟");
    assert.equal(s1.isRedlineMedical, false);
    assert.equal(s1.riskLevel, "safe");
    assert.equal(s1.deterministicRule, undefined);
  });

  await t.test("2. Vault: AES-256-GCM Encryption, Decryption & Masking", async () => {
    const secret = "ghp_super_secret_token_123456789";
    const enc = encryptSecret(secret);
    assert.ok(enc.encryptedBlob.startsWith("enc:aes-256-gcm:"));
    assert.equal(enc.ivPreview.length, 8);
    assert.equal(enc.authTagPreview.length, 8);

    const decrypted = decryptSecret(enc.encryptedBlob);
    assert.equal(decrypted, secret);

    const masked = maskSecret("github", secret);
    assert.ok(masked.startsWith("ghp_••••••••••••"));
    assert.ok(masked.endsWith("6789"));
  });

  await t.test("3. Auth: Token Authentication & RBAC", async () => {
    // Master secret superadmin bypass
    const adminUser = authenticateToken(`Bearer ${PANEL_API_SECRET}`);
    assert.ok(adminUser);
    assert.equal(adminUser?.role, "admin");
    assert.equal(adminUser?.tenantId, "system");

    // Invalid token
    const invalidUser = authenticateToken("Bearer invalid-secret");
    assert.equal(invalidUser, null);

    // Operator session
    const sessionId = createOperatorSession();
    const sessionCookie = `bale_panel_session=${sessionId}`;
    const sessUser = sessionUser(sessionCookie);
    assert.ok(sessUser);
    assert.equal(sessUser?.role, "admin");

    // Clean up
    operatorSessions.delete(sessionId);
  });

  await t.test("4. HTTP Endpoint: Health Check", async () => {
    const res = await request(testServer, { method: "GET", path: "/api/health" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.ok(res.body.timestamp);
  });

  await t.test("5. HTTP Endpoints: Auth Routes (Login, Session, Logout)", async () => {
    // 5.1 Invalid login
    const failLogin = await request(testServer, {
      method: "POST",
      path: "/api/auth/login",
      body: { secret: "wrong" },
    });
    assert.equal(failLogin.status, 401);

    // 5.2 Valid login
    const successLogin = await request(testServer, {
      method: "POST",
      path: "/api/auth/login",
      body: { secret: PANEL_API_SECRET },
    });
    assert.equal(successLogin.status, 200);
    assert.equal(successLogin.body.authenticated, true);
    const cookie = successLogin.headers["set-cookie"]?.[0] || "";
    assert.ok(cookie.includes("bale_panel_session="));
    assert.ok(cookie.includes("HttpOnly"));
    assert.ok(cookie.includes("SameSite=Strict"));
    if (process.env.NODE_ENV === "production") assert.ok(cookie.includes("Secure"));

    // 5.3 Session check with cookie
    const checkSession = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
      headers: { Cookie: cookie },
    });
    assert.equal(checkSession.status, 200);
    assert.equal(checkSession.body.authenticated, true);

    // 5.4 The HttpOnly session authorizes protected routes without exposing a bearer token.
    const sessionAdmin = await request(testServer, {
      method: "GET",
      path: "/api/admin/keys",
      headers: { Cookie: cookie },
    });
    assert.equal(sessionAdmin.status, 200);
    assert.equal(sessionAdmin.body.success, true);

    // 5.5 Logout
    const logout = await request(testServer, {
      method: "POST",
      path: "/api/auth/logout",
      headers: { Cookie: cookie },
    });
    assert.equal(logout.status, 204);
    const clearedCookie = logout.headers["set-cookie"]?.[0] || "";
    assert.ok(clearedCookie.includes("HttpOnly"));
    assert.ok(clearedCookie.includes("SameSite=Strict"));
    if (process.env.NODE_ENV === "production") assert.ok(clearedCookie.includes("Secure"));
  });

  await t.test("6. HTTP Endpoints: Guarded Routes & RBAC Enforcement", async () => {
    // Unauthenticated access to /api/admin/keys -> 401
    const unauthAdmin = await request(testServer, { method: "GET", path: "/api/admin/keys" });
    assert.equal(unauthAdmin.status, 401);

    // Authenticated access with Master Key -> 200
    const authAdmin = await request(testServer, {
      method: "GET",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(authAdmin.status, 200);
    assert.equal(authAdmin.body.success, true);
    assert.ok(Array.isArray(authAdmin.body.keys));

    // Validation: POST /api/admin/keys requires valid name and role
    const emptyNameRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "   ", role: "auditor" },
    });
    assert.equal(emptyNameRes.status, 400);

    const invalidRoleRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Test Key", role: "superadmin" },
    });
    assert.equal(invalidRoleRes.status, 400);

    // Create an Auditor API Key
    const createKeyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Auditor Bot", role: "auditor", tenantId: "clinical-branch-1" },
    });
    assert.equal(createKeyRes.status, 200);
    assert.equal(createKeyRes.body.success, true);
    const auditorToken = createKeyRes.body.key.rawToken;
    const auditorKeyId = createKeyRes.body.key.id;
    assert.ok(auditorToken.startsWith("emb_auditor_"));

    // Auditor key can access auditor-allowed route (/api/gateways/pulse-ping)
    const auditorAccessRes = await request(testServer, {
      method: "POST",
      path: "/api/gateways/pulse-ping",
      headers: { Authorization: `Bearer ${auditorToken}` },
      body: {},
    });
    assert.equal(auditorAccessRes.status, 200);

    // Auditor key CANNOT access admin-only route (/api/admin/keys) -> 403 Forbidden
    const auditorForbiddenRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    assert.equal(auditorForbiddenRes.status, 403);
    assert.ok(auditorForbiddenRes.body.error.includes("Forbidden"));

    // Revoke key: DELETE /api/admin/keys/:id
    const deleteKeyRes = await request(testServer, {
      method: "DELETE",
      path: `/api/admin/keys/${auditorKeyId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(deleteKeyRes.status, 200);
    assert.equal(deleteKeyRes.body.success, true);

    // Revoked key can no longer authenticate -> 401 Unauthorized
    const postDeleteRes = await request(testServer, {
      method: "POST",
      path: "/api/gateways/pulse-ping",
      headers: { Authorization: `Bearer ${auditorToken}` },
      body: {},
    });
    assert.equal(postDeleteRes.status, 401);
  });

  await t.test("7. HTTP Endpoints: Vault Credentials Management", async () => {
    // 7.1 List credentials
    const listRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/auth-credentials",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.credentials));

    // 7.2 Add new credential
    const addRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/auth-credentials",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        service: "github",
        label: "CI Test GitHub Key",
        secret: "ghp_test_secret_for_automated_verification_1234",
        agentId: "test-agent",
        agentName: "تست ایجنت",
      },
    });
    assert.equal(addRes.status, 200);
    assert.equal(addRes.body.success, true);
    const newId = addRes.body.credential.id;

    // 7.3 Test integrity of newly created credential
    const testRes = await request(testServer, {
      method: "POST",
      path: `/api/admin/auth-credentials/test/${newId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(testRes.status, 200);
    assert.equal(testRes.body.integrity, "PASSED");

    // 7.4 Delete credential
    const delRes = await request(testServer, {
      method: "DELETE",
      path: `/api/admin/auth-credentials/${newId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);
  });

  await t.test("8. HTTP Endpoints: Pipeline State & Message Processing", async () => {
    // 8.1 Pipeline State
    const stateRes = await request(testServer, {
      method: "GET",
      path: "/api/pipeline/state",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(stateRes.status, 200);
    assert.equal(stateRes.body.status, "operational");
    assert.ok(Array.isArray(stateRes.body.channels));
    assert.ok(Array.isArray(stateRes.body.shadowQueue));

    // 8.2 Process Message through Pipeline
    const procRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/process",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        channel: "sms",
        senderId: "test-chat-100",
        senderDisplay: "کاربر تستی",
        text: "قیمت استامینوفن",
        domainContext: "Clinical",
        environmentMode: "shadow",
      },
    });
    assert.equal(procRes.status, 200);
    assert.equal(procRes.body.success, true);
    assert.ok(procRes.body.shadowRecord);
    assert.equal(procRes.body.shadowRecord.riskLevel, "medium_risk");
    assert.equal(procRes.body.shadowRecord.deterministicRuleApplied, "QANOON_PRICE_DETERMINISTIC_ENGINE (ADR-0001)");

    const recordId = procRes.body.shadowRecord.id;

    // 8.3 HITL Action: Approve Shadow Record
    const actionRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        id: recordId,
        action: "approve",
      },
    });
    assert.equal(actionRes.status, 200);
    assert.equal(actionRes.body.success, true);
    assert.equal(actionRes.body.item.status, "approved");

    // 8.4 Ingest Shadow Trace from Backend Engines (bale-auto/bale-med/Bale-EMS contract)
    const ingestBadRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/ingest/shadow-trace",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(ingestBadRes.status, 400);

    const externalRecordId = `sh-ext-${Date.now()}`;
    const ingestOkRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/ingest/shadow-trace",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        engine_id: "bale-med",
        shadow_item: {
          id: externalRecordId,
          sessionId: "bale-chat-999",
          channel: "bale",
          senderDisplay: "دکتر رضایی",
          userMessage: "دستور مصرف آموکسی‌سیلین ۵۰۰",
          proposedReply: "هر ۸ ساعت یک عدد میل شود.",
          status: "pending",
          riskLevel: "medium_risk",
        },
      },
    });
    assert.equal(ingestOkRes.status, 200);
    assert.equal(ingestOkRes.body.success, true);

    // 8.5 HITL Action: Reject Shadow Record
    const rejectRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        id: externalRecordId,
        action: "reject",
      },
    });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.success, true);
    assert.equal(rejectRes.body.item.status, "rejected");

    // 8.6 HITL Action Validation: missing id returns 400
    const missingIdRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { action: "approve" },
    });
    assert.equal(missingIdRes.status, 400);
  });

  await t.test("9. HTTP Endpoints: Webhook Ingress (Bale & Evolution)", async () => {
    // 9.1 Bale Webhook Secret Mismatch -> 403 Forbidden
    const baleWrongSecret = await request(testServer, {
      method: "POST",
      path: "/webhook/bale",
      headers: { "x-telegram-bot-api-secret-token": "wrong_secret" },
      body: { message: { text: "hello", chat: { id: 12345 } } },
    });
    assert.equal(baleWrongSecret.status, 403);

    // 9.2 Bale Webhook Correct Secret -> 200 OK
    const baleOk = await request(testServer, {
      method: "POST",
      path: "/webhook/bale",
      headers: { "x-telegram-bot-api-secret-token": BALE_WEBHOOK_SECRET },
      body: {
        message: {
          chat: { id: 98765 },
          from: { first_name: "Ali", last_name: "Reza" },
          text: "سلام ربات",
        },
      },
    });
    assert.equal(baleOk.status, 200);
    assert.equal(baleOk.body.ok, true);

    // 9.3 Evolution Webhook -> 200 OK
    const waOk = await request(testServer, {
      method: "POST",
      path: "/webhook/evolution",
      body: {
        event: "messages.upsert",
        data: {
          messages: [
            {
              key: { remoteJid: "989120000000@s.whatsapp.net", fromMe: false },
              pushName: "Hossein",
              message: { conversation: "سلام نسخه من آماده است؟" },
            },
          ],
        },
      },
    });
    assert.equal(waOk.status, 200);
    assert.equal(waOk.body.status, "received");

    // 9.4 Bale Webhook Empty Body Resilience -> 200 OK
    const baleEmptyRes = await request(testServer, {
      method: "POST",
      path: "/webhook/bale",
      headers: { "x-telegram-bot-api-secret-token": BALE_WEBHOOK_SECRET },
      body: {},
    });
    assert.equal(baleEmptyRes.status, 200);
    assert.equal(baleEmptyRes.body.ok, true);

    // 9.5 Evolution Webhook Empty Body Resilience -> 200 OK
    const waEmptyRes = await request(testServer, {
      method: "POST",
      path: "/webhook/evolution",
      body: {},
    });
    assert.equal(waEmptyRes.status, 200);
    assert.equal(waEmptyRes.body.status, "received");
  });

  await t.test("10. HTTP Endpoints: Gateways Telemetry & Audit History", async () => {
    // 10.1 Pulse settings
    const pulseRes = await request(testServer, {
      method: "GET",
      path: "/api/system/pulse-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(pulseRes.status, 200);
    assert.ok(pulseRes.body.config);
    assert.ok(pulseRes.body.telemetry);

    // 10.2 Pulse ping
    const pingRes = await request(testServer, {
      method: "POST",
      path: "/api/gateways/pulse-ping",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { mode: "baseline" },
    });
    assert.equal(pingRes.status, 200);
    assert.equal(pingRes.body.success, true);

    // 10.3 Gateway status change
    const statusRes = await request(testServer, {
      method: "POST",
      path: "/api/gateways/status",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { channelId: "telegram", status: "active", reason: "Automated test" },
    });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.status, "active");

    // 10.3b Gateway status validation: empty body and invalid channel/status
    const statusEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/gateways/status",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(statusEmptyRes.status, 400);

    const statusInvalidChannel = await request(testServer, {
      method: "POST",
      path: "/api/gateways/status",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { channelId: "unknown_channel", status: "active" },
    });
    assert.equal(statusInvalidChannel.status, 400);

    const statusInvalidStatus = await request(testServer, {
      method: "POST",
      path: "/api/gateways/status",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { channelId: "telegram", status: "invalid_status" },
    });
    assert.equal(statusInvalidStatus.status, 400);

    // 10.3c Pulse settings empty body safe handling
    const pulseEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/system/pulse-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(pulseEmptyRes.status, 200);
    assert.equal(pulseEmptyRes.body.success, true);

    // 10.4 Gateway history
    const histRes = await request(testServer, {
      method: "GET",
      path: "/api/gateways/history",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: undefined,
    });
    assert.equal(histRes.status, 200);
    assert.equal(histRes.body.success, true);
    assert.ok(Array.isArray(histRes.body.events));
  });

  await t.test("11. HTTP Endpoints: Work Ledger & Privacy Settings", async () => {
    // 11.1 List ledger items
    const ledgerList = await request(testServer, {
      method: "GET",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(ledgerList.status, 200);
    assert.ok(Array.isArray(ledgerList.body.items));

    // 11.2 Validation: reject empty/missing title
    const emptyTitleRes = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { title: "   " },
    });
    assert.equal(emptyTitleRes.status, 400);

    const emptyBodyRes = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(emptyBodyRes.status, 400);

    // 11.3 Add ledger item
    const addLedger = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        title: "بررسی تست خودکار ماژولاربندی بک‌اند",
        domainCategory: "Executive",
        summary: "تست صحت یکپارچگی ماژول‌ها و پایپ‌لاین",
      },
    });
    assert.equal(addLedger.status, 200);
    assert.equal(addLedger.body.success, true);
    assert.ok(addLedger.body.item);
    const createdId = addLedger.body.item.id;

    // 11.4 PATCH update ledger item
    const patchRes = await request(testServer, {
      method: "PATCH",
      path: `/api/ledger/items/${createdId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        title: "عنوان به‌روزشده در آزمون واحد",
        tasksPending: 0,
      },
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.success, true);
    assert.equal(patchRes.body.item.title, "عنوان به‌روزشده در آزمون واحد");
    assert.equal(patchRes.body.item.tasksPending, 0);

    // PATCH non-existent item returns 404
    const patchNotFound = await request(testServer, {
      method: "PATCH",
      path: "/api/ledger/items/wld-nonexistent",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { title: "عدم وجود" },
    });
    assert.equal(patchNotFound.status, 404);

    // 11.5 DELETE ledger item
    const delRes = await request(testServer, {
      method: "DELETE",
      path: `/api/ledger/items/${createdId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.success, true);
    assert.equal(delRes.body.removed.id, createdId);

    // DELETE non-existent item returns 404
    const delNotFound = await request(testServer, {
      method: "DELETE",
      path: `/api/ledger/items/${createdId}`,
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(delNotFound.status, 404);

    // 11.6 Privacy settings toggle
    const privacyRes = await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { retentionPolicy: "ephemeral", scrubSensitiveMedicalNotes: true },
    });
    assert.equal(privacyRes.status, 200);
    assert.equal(privacyRes.body.settings.retentionPolicy, "ephemeral");

    // Empty body does not crash privacy settings
    const privacyEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(privacyEmptyRes.status, 200);

    // Reset back to audited
    await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { retentionPolicy: "audited" },
    });
  });

  await t.test("12. HTTP Endpoints: Evolution API WhatsApp Hub", async () => {
    // 12.1 Status
    const evStatus = await request(testServer, {
      method: "GET",
      path: "/api/evolution/status",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(evStatus.status, 200);
    assert.equal(evStatus.body.instance.instanceName, "embednet-wa-primary");

    // 12.2 Pair code
    const pairRes = await request(testServer, {
      method: "POST",
      path: "/api/evolution/pair-code",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { phoneNumber: "+989121234567" },
    });
    assert.equal(pairRes.status, 200);
    assert.ok(pairRes.body.pairingCode);

    // 12.3 Anti-ban Cold Outreach rejection
    const coldInbound = await request(testServer, {
      method: "POST",
      path: "/api/evolution/inbound-message",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        messageText: "Cold outreach message",
        isInitiatedByCounterparty: false,
      },
    });
    assert.equal(coldInbound.status, 403);
    assert.equal(coldInbound.body.antiBanViolation, "STRICT_INBOUND_REQUIRED");
  });

  await t.test("13. HTTP Endpoints: Admin Telegram Keyboards & WebApps", async () => {
    // 13.1 Validation: Keyboard creation rejects empty payload
    const kbEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/telegram/keyboards",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(kbEmptyRes.status, 400);

    // 13.2 Keyboards CRUD
    const kbCreate = await request(testServer, {
      method: "POST",
      path: "/api/admin/telegram/keyboards",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        id: "test-kb-1",
        name: "Test Keyboard",
        schemaJson: JSON.stringify({ keyboard: [["Button 1"]] }),
      },
    });
    assert.equal(kbCreate.status, 200);
    assert.equal(kbCreate.body.keyboard.id, "test-kb-1");

    const kbList = await request(testServer, {
      method: "GET",
      path: "/api/admin/telegram/keyboards",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(kbList.status, 200);
    assert.ok(kbList.body.keyboards.some((k: any) => k.id === "test-kb-1"));

    const kbDel = await request(testServer, {
      method: "DELETE",
      path: "/api/admin/telegram/keyboards/test-kb-1",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(kbDel.status, 200);
    assert.equal(kbDel.body.success, true);

    // 13.3 WebApps CRUD
    const waEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/telegram/webapps",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(waEmptyRes.status, 400);

    const waCreate = await request(testServer, {
      method: "POST",
      path: "/api/admin/telegram/webapps",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        id: "test-wa-1",
        name: "Test WebApp",
        url: "https://bale.ai/app",
        configJson: JSON.stringify({ version: "1.0" }),
      },
    });
    assert.equal(waCreate.status, 200);
    assert.equal(waCreate.body.webapp.id, "test-wa-1");

    const waList = await request(testServer, {
      method: "GET",
      path: "/api/admin/telegram/webapps",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(waList.status, 200);
    assert.ok(waList.body.webapps.some((w: any) => w.id === "test-wa-1"));

    const waDel = await request(testServer, {
      method: "DELETE",
      path: "/api/admin/telegram/webapps/test-wa-1",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(waDel.status, 200);
    assert.equal(waDel.body.success, true);
  });

  await t.test("14. Edge Cases, Tamper Detection & Error Paths", async () => {
    // 14.1 AES-256-GCM Tamper Detection
    const validEnc = encryptSecret("sample_secret");
    const tamperedBlob = validEnc.encryptedBlob.slice(0, -4) + "ffff";
    assert.throws(() => {
      decryptSecret(tamperedBlob);
    }, /Unsupported state or unable to authenticate data|Invalid/);

    // 14.2 Invalid encrypted format
    assert.throws(() => {
      decryptSecret("invalid:format");
    }, /Invalid encrypted format/);

    // 14.3 Pipeline process with empty text -> 400
    const emptyProc = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/process",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { text: "   " },
    });
    assert.equal(emptyProc.status, 400);
    assert.equal(emptyProc.body.error, "Message text is required.");

    // 14.4 Shadow action: non-existent item -> 404
    const notFoundAction = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { id: "non-existent-sh-99999", action: "approve" },
    });
    assert.equal(notFoundAction.status, 404);

    // 14.5 Shadow action: invalid action -> 400
    // Insert a dummy shadow item to test invalid action
    const dummyId = `sh-dummy-test-${Date.now()}`;
    shadowDB.insert({
      id: dummyId,
      sessionId: "bale-test",
      channel: "bale",
      senderDisplay: "Tester",
      userMessage: "Test",
      proposedReply: "Reply",
      timestamp: "Now",
      confidenceScore: 0.9,
      riskLevel: "safe",
      status: "pending",
    });

    const invalidAction = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { id: dummyId, action: "explode" },
    });
    assert.equal(invalidAction.status, 400);

    // 14.6 Shadow action: modify without editedReply -> 400
    const modifyMissing = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/shadow/action",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { id: dummyId, action: "modify" },
    });
    assert.equal(modifyMissing.status, 400);

    // 14.7 API Key create with invalid role -> 400
    const invalidRoleKey = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Bad Key", role: "superhacker" },
    });
    assert.equal(invalidRoleKey.status, 400);

    // 14.8 Vault credential with invalid service -> 400
    const invalidService = await request(testServer, {
      method: "POST",
      path: "/api/admin/auth-credentials",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { service: "unknown_svc", label: "Test", secret: "secret" },
    });
    assert.equal(invalidService.status, 400);

    // 14.9 Vault delete non-existent -> 404
    const delNotFound = await request(testServer, {
      method: "DELETE",
      path: "/api/admin/auth-credentials/cred-non-existent-9999",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(delNotFound.status, 404);
  });

  await t.test("15. Unauthenticated routes do not disclose operator credentials", async () => {
    // 15.1 The removed bootstrap route must not disclose a credential.
    const tokenRes = await request(testServer, {
      method: "GET",
      path: "/api/auth/token",
    });
    assert.equal(tokenRes.status, 404);
    assert.notEqual(tokenRes.body?.token, PANEL_API_SECRET);

    // 15.2 GET /api/health without auth -> 200
    const healthRes = await request(testServer, {
      method: "GET",
      path: "/api/health",
    });
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.status, "ok");

    // 15.3 GET /api/sessions/overview without auth -> 200
    const sessionsRes = await request(testServer, {
      method: "GET",
      path: "/api/sessions/overview",
    });
    assert.equal(sessionsRes.status, 200);
    assert.equal(sessionsRes.body.success, true);
    assert.ok(Array.isArray(sessionsRes.body.sessions));

    // 15.4 POST /api/bot/clear without auth -> 200
    const clearRes = await request(testServer, {
      method: "POST",
      path: "/api/bot/clear",
      body: { sessionId: "test-clear-session" },
    });
    assert.equal(clearRes.status, 200);
    assert.equal(clearRes.body.success, true);

    // 15.5 POST /api/notes/structure without auth (empty payload -> 400, not 401)
    const noteRes = await request(testServer, {
      method: "POST",
      path: "/api/notes/structure",
      body: { rawInput: "" },
    });
    assert.equal(noteRes.status, 400);
    assert.equal(noteRes.body.error, "rawInput is required.");

    // 15.6 POST /api/memory/query without auth (empty query -> 400, not 401)
    const memRes = await request(testServer, {
      method: "POST",
      path: "/api/memory/query",
      body: { query: "" },
    });
    assert.equal(memRes.status, 400);
    assert.equal(memRes.body.error, "query is required");

    // 15.7 POST /api/bot/chat without auth (missing body -> 400, not 401)
    const chatRes = await request(testServer, {
      method: "POST",
      path: "/api/bot/chat",
      body: {},
    });
    assert.equal(chatRes.status, 400);
    assert.equal(chatRes.body.error, "Message or image is required.");
  });

  await t.test("16. Session Auth Parity: Dual Bearer & Cookie Support", async () => {
    // 16.1 GET /api/auth/session with valid Bearer token -> authenticated: true
    const bearerRes = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(bearerRes.status, 200);
    assert.equal(bearerRes.body.authenticated, true);

    // 16.2 GET /api/auth/session with session cookie -> authenticated: true
    const sessionId = createOperatorSession();
    const cookieRes = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
      headers: { Cookie: `bale_panel_session=${sessionId}` },
    });
    assert.equal(cookieRes.status, 200);
    assert.equal(cookieRes.body.authenticated, true);

    // 16.3 GET /api/auth/session with invalid Bearer token -> authenticated: false
    const invalidBearerRes = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
      headers: { Authorization: "Bearer invalid_secret_token" },
    });
    assert.equal(invalidBearerRes.status, 200);
    assert.equal(invalidBearerRes.body.authenticated, false);

    // 16.4 GET /api/auth/session without headers -> authenticated: false
    const anonRes = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
    });
    assert.equal(anonRes.status, 200);
    assert.equal(anonRes.body.authenticated, false);
  });

  await t.test("17. Concurrency & Collision Resistance: Rapid Parallel Ingress", async () => {
    const burstCount = 20;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < burstCount; i++) {
      promises.push(
        request(testServer, {
          method: "POST",
          path: "/webhook/bale",
          headers: { "x-telegram-bot-api-secret-token": BALE_WEBHOOK_SECRET },
          body: {
            message: {
              chat: { id: 70000 + i },
              from: { first_name: `BurstUser${i}` },
              text: `پیام موازی شماره ${i}`,
            },
          },
        })
      );
    }

    const results = await Promise.all(promises);

    // All burst requests must acknowledge 200 OK without dropping
    for (const res of results) {
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);
    }
  });

  await t.test("18. Evolution Inbound Parallel Burst & Ledger ID Uniqueness", async () => {
    const burstCount = 20;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < burstCount; i++) {
      promises.push(
        request(testServer, {
          method: "POST",
          path: "/api/evolution/inbound-message",
          headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
          body: {
            senderPhone: `+98912000${1000 + i}`,
            senderName: `ConcurrentPatient${i}`,
            messageText: `نسخه موازی بیمار ${i}`,
            isInitiatedByCounterparty: true,
          },
        })
      );
    }

    const results = await Promise.all(promises);
    const ledgerIds = new Set<string>();

    for (const res of results) {
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.persistedInLedgerId);
      ledgerIds.add(res.body.persistedInLedgerId);
    }

    // Every concurrent message must receive a strictly unique ledger ID
    assert.equal(ledgerIds.size, burstCount);
  });

  await t.test("19. Robustness & Constant-Time Security Parity", async () => {
    // 19.1 secureEquals behavior
    assert.equal(secureEquals("super_secret_token", "super_secret_token"), true);
    assert.equal(secureEquals("super_secret_token", "wrong_secret_token"), false);
    assert.equal(secureEquals("short", "much_longer_secret_token"), false);
    assert.equal(secureEquals("" as any, "token"), false);
    assert.equal(secureEquals(null as any, "token"), false);
    assert.equal(secureEquals(undefined as any, "token"), false);
    assert.equal(secureEquals(12345 as any, "token"), false);

    // 19.2 POST /webhook/evolution with empty body does not crash
    const evoEmptyRes = await request(testServer, {
      method: "POST",
      path: "/webhook/evolution",
      body: {},
    });
    assert.equal(evoEmptyRes.status, 200);
    assert.equal(evoEmptyRes.body.status, "received");

    // 19.3 POST /api/pipeline/process without text returns 400 Bad Request (not 500)
    const pipeEmptyBodyRes = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/process",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(pipeEmptyBodyRes.status, 400);
    assert.equal(pipeEmptyBodyRes.body.error, "Message text is required.");

    // 19.4 POST /api/admin/sandbox/create without guestName returns 400
    const sbxEmptyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/sandbox/create",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {},
    });
    assert.equal(sbxEmptyRes.status, 400);
    assert.equal(sbxEmptyRes.body.error, "guestName is required");
  });

  await t.test("20. Phase 6a: Health Liveness Probe & Shadow Trace Streaming Contract", async () => {
    // 20.1 GET /api/health probe is public and returns 200 with database status
    const healthRes = await request(testServer, {
      method: "GET",
      path: "/api/health",
    });
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.status, "ok");
    assert.equal(healthRes.body.db, "connected");
    assert.ok(typeof healthRes.body.queueSize === "number");

    // 20.2 POST /api/pipeline/ingest/shadow-trace requires operator auth
    const unauthIngest = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/ingest/shadow-trace",
      body: { engine_id: "bale-med", shadow_item: {} },
    });
    assert.equal(unauthIngest.status, 401);

    // 20.3 Ingest validates required shadow_item fields
    const invalidIngest = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/ingest/shadow-trace",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        engine_id: "bale-med",
        shadow_item: { userMessage: "test message without reply" },
      },
    });
    assert.equal(invalidIngest.status, 400);
    assert.match(invalidIngest.body.error, /userMessage and proposedReply/);

    // 20.4 Ingest valid shadow trace returns 200 and record id
    const validIngest = await request(testServer, {
      method: "POST",
      path: "/api/pipeline/ingest/shadow-trace",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: {
        engine_id: "bale-med",
        shadow_item: {
          sessionId: "bale-session-phase6a",
          channel: "bale",
          userMessage: "سلام، قیمت آزیترومایسین چنده؟",
          proposedReply: "پیام شما دریافت شد و به داروساز ارجاع گردید.",
          riskLevel: "safe",
        },
      },
    });
    assert.equal(validIngest.status, 200);
    assert.equal(validIngest.body.success, true);
    assert.ok(validIngest.body.id);

    // 20.5 GET /api/pipeline/stream requires operator auth
    const unauthStream = await request(testServer, {
      method: "GET",
      path: "/api/pipeline/stream",
    });
    assert.equal(unauthStream.status, 401);
  });

  await t.test("21. Phase 2: Admin Authentication, Multi-Credential RBAC & Session Parity", async () => {
    // 21.1 Unauthenticated requests to all /api/admin/* and /api/system/* endpoints return 401
    const adminEndpoints = [
      { method: "GET" as const, path: "/api/admin/keys" },
      { method: "GET" as const, path: "/api/admin/integrations" },
      { method: "POST" as const, path: "/api/admin/integrations/toggle", body: { field: "activeAiProvider", value: "gemini" } },
      { method: "POST" as const, path: "/api/admin/sandbox/create", body: { guestName: "Hacker" } },
      { method: "GET" as const, path: "/api/admin/telegram/keyboards" },
      { method: "GET" as const, path: "/api/admin/telegram/webapps" },
      { method: "GET" as const, path: "/api/admin/auth-credentials" },
      { method: "GET" as const, path: "/api/system/pulse-settings" },
    ];

    for (const ep of adminEndpoints) {
      const res = await request(testServer, {
        method: ep.method,
        path: ep.path,
        body: ep.body,
      });
      assert.equal(res.status, 401, `Expected 401 for unauthenticated ${ep.method} ${ep.path}, got ${res.status}`);
    }

    // 21.2 Create Operator and Admin API keys for RBAC evaluation
    const opKeyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Operator Bot", role: "operator", tenantId: "ops-tenant" },
    });
    assert.equal(opKeyRes.status, 200);
    const opToken = opKeyRes.body.key.rawToken;
    assert.ok(opToken.startsWith("emb_operator_"));

    const admKeyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Secondary Admin", role: "admin", tenantId: "admin-tenant" },
    });
    assert.equal(admKeyRes.status, 200);
    const admToken = admKeyRes.body.key.rawToken;
    assert.ok(admToken.startsWith("emb_admin_"));

    // 21.3 Operator role lacks admin privilege -> 403 Forbidden on all admin routes
    for (const ep of adminEndpoints) {
      const res = await request(testServer, {
        method: ep.method,
        path: ep.path,
        headers: { Authorization: `Bearer ${opToken}` },
        body: ep.body,
      });
      assert.equal(res.status, 403, `Expected 403 for operator ${ep.method} ${ep.path}, got ${res.status}`);
      assert.ok(res.body.error.includes("Forbidden"));
    }

    // 21.4 Admin role API Key possesses full admin authority -> 200 OK on admin routes
    const admKeysRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${admToken}` },
    });
    assert.equal(admKeysRes.status, 200);
    assert.equal(admKeysRes.body.success, true);

    const admIntegrationsRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/integrations",
      headers: { Authorization: `Bearer ${admToken}` },
    });
    assert.equal(admIntegrationsRes.status, 200);
    assert.equal(admIntegrationsRes.body.success, true);

    const admVaultRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/auth-credentials",
      headers: { Authorization: `Bearer ${admToken}` },
    });
    assert.equal(admVaultRes.status, 200);
    assert.equal(admVaultRes.body.success, true);

    const admTelegramRes = await request(testServer, {
      method: "GET",
      path: "/api/admin/telegram/keyboards",
      headers: { Authorization: `Bearer ${admToken}` },
    });
    assert.equal(admTelegramRes.status, 200);

    // 21.5 Admin Login with Admin API Key via POST /api/auth/login
    // Non-admin operator token fails login -> 401
    const opLoginRes = await request(testServer, {
      method: "POST",
      path: "/api/auth/login",
      body: { secret: opToken },
    });
    assert.equal(opLoginRes.status, 401);

    // Admin API token succeeds login -> 200 + Session Cookie with admin role
    const admLoginRes = await request(testServer, {
      method: "POST",
      path: "/api/auth/login",
      body: { secret: admToken },
    });
    assert.equal(admLoginRes.status, 200);
    assert.equal(admLoginRes.body.authenticated, true);
    assert.equal(admLoginRes.body.role, "admin");
    const admCookie = admLoginRes.headers["set-cookie"]?.[0] || "";
    assert.ok(admCookie.includes("bale_panel_session="));

    // 21.6 Session established via Admin Key authorizes protected admin routes
    const sessionAdminAccess = await request(testServer, {
      method: "GET",
      path: "/api/admin/keys",
      headers: { Cookie: admCookie },
    });
    assert.equal(sessionAdminAccess.status, 200);
    assert.equal(sessionAdminAccess.body.success, true);

    // 21.7 Session status endpoint returns complete authenticated metadata
    const sessionCheck = await request(testServer, {
      method: "GET",
      path: "/api/auth/session",
      headers: { Cookie: admCookie },
    });
    assert.equal(sessionCheck.status, 200);
    assert.equal(sessionCheck.body.authenticated, true);
    assert.equal(sessionCheck.body.role, "admin");
    assert.equal(sessionCheck.body.name, "Secondary Admin");
  });

  await t.test("22. Phase 2: Work Ledger Integration, RBAC Guardrails & Privacy Settings Contract", async () => {
    // 22.1 Create distinct API keys for Auditor, Operator, and Admin roles
    const auditorKeyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Auditor Key", role: "auditor", tenantId: "audit-tenant" },
    });
    assert.equal(auditorKeyRes.status, 200);
    const auditorToken = auditorKeyRes.body.key.rawToken;

    const operatorKeyRes = await request(testServer, {
      method: "POST",
      path: "/api/admin/keys",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { name: "Ledger Operator Key", role: "operator", tenantId: "ops-tenant" },
    });
    assert.equal(operatorKeyRes.status, 200);
    const operatorToken = operatorKeyRes.body.key.rawToken;

    // 22.2 Work Ledger Unauthenticated Access -> 401 Unauthorized
    const unauthLedgerGet = await request(testServer, {
      method: "GET",
      path: "/api/ledger/items",
    });
    assert.equal(unauthLedgerGet.status, 401);
    assert.equal(unauthLedgerGet.body.error, "Unauthorized. Valid Bearer token required.");

    const unauthLedgerPost = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      body: { title: "تست غیرمجاز" },
    });
    assert.equal(unauthLedgerPost.status, 401);

    const unauthLedgerPatch = await request(testServer, {
      method: "PATCH",
      path: "/api/ledger/items/wld-any-id",
      body: { title: "تست پچ غیرمجاز" },
    });
    assert.equal(unauthLedgerPatch.status, 401);

    const unauthLedgerDelete = await request(testServer, {
      method: "DELETE",
      path: "/api/ledger/items/wld-any-id",
    });
    assert.equal(unauthLedgerDelete.status, 401);

    // 22.3 Auditor Role RBAC Guard -> 403 Forbidden (Auditor lacks operator privileges for ledger)
    const auditorLedgerGet = await request(testServer, {
      method: "GET",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    assert.equal(auditorLedgerGet.status, 403);
    assert.ok(auditorLedgerGet.body.error.includes("Forbidden"));

    const auditorLedgerPost = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${auditorToken}` },
      body: { title: "تست توسط حسابرس" },
    });
    assert.equal(auditorLedgerPost.status, 403);

    // 22.4 Operator Role RBAC -> 200 OK for Ledger List & Validation
    const opLedgerGet = await request(testServer, {
      method: "GET",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(opLedgerGet.status, 200);
    assert.equal(opLedgerGet.body.success, true);
    assert.ok(Array.isArray(opLedgerGet.body.items));

    // Validation: Empty or blank title returns 400
    const opEmptyTitle = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: { title: "   " },
    });
    assert.equal(opEmptyTitle.status, 400);

    // 22.5 Full Ledger Lifecycle Integration (Create -> Read -> Update -> Verify -> Delete)
    const createLedgerRes = await request(testServer, {
      method: "POST",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {
        title: "پرونده بالینی اورژانس - Bale-EMS Shadow Ingest",
        domainCategory: "Clinical",
        summary: "انتقال خودکار نسخه الکترونیک به دفتر کار",
        activeContext: "اتاق عملیات تریاژ",
      },
    });
    assert.equal(createLedgerRes.status, 200);
    assert.equal(createLedgerRes.body.success, true);
    const createdItem = createLedgerRes.body.item;
    assert.ok(createdItem.id.startsWith("wld-"));
    assert.equal(createdItem.title, "پرونده بالینی اورژانس - Bale-EMS Shadow Ingest");
    assert.equal(createdItem.domainCategory, "Clinical");
    assert.equal(createdItem.tasksPending, 1);

    // Verify item is present in list retrieved by operator
    const listAfterCreate = await request(testServer, {
      method: "GET",
      path: "/api/ledger/items",
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(listAfterCreate.status, 200);
    const foundItem = listAfterCreate.body.items.find((it: any) => it.id === createdItem.id);
    assert.ok(foundItem, "Created ledger item must be present in ledger list");

    // PATCH item status and title
    const patchLedgerRes = await request(testServer, {
      method: "PATCH",
      path: `/api/ledger/items/${createdItem.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {
        title: "پرونده بالینی اورژانس - تایید پزشک نهایی شد",
        tasksPending: 0,
      },
    });
    assert.equal(patchLedgerRes.status, 200);
    assert.equal(patchLedgerRes.body.success, true);
    assert.equal(patchLedgerRes.body.item.title, "پرونده بالینی اورژانس - تایید پزشک نهایی شد");
    assert.equal(patchLedgerRes.body.item.tasksPending, 0);

    // DELETE item with operator token
    const deleteLedgerRes = await request(testServer, {
      method: "DELETE",
      path: `/api/ledger/items/${createdItem.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(deleteLedgerRes.status, 200);
    assert.equal(deleteLedgerRes.body.success, true);
    assert.equal(deleteLedgerRes.body.removed.id, createdItem.id);

    // Verify 404 on already-deleted item
    const repeatDeleteRes = await request(testServer, {
      method: "DELETE",
      path: `/api/ledger/items/${createdItem.id}`,
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(repeatDeleteRes.status, 404);

    // 22.6 Privacy Settings Integration & Admin Auth Guardrails
    // Unauthenticated GET /api/system/privacy-settings -> 401
    const unauthPrivacyGet = await request(testServer, {
      method: "GET",
      path: "/api/system/privacy-settings",
    });
    assert.equal(unauthPrivacyGet.status, 401);

    // Operator token attempting GET /api/system/privacy-settings -> 403 (guarded by requireAdminAuth)
    const operatorPrivacyGet = await request(testServer, {
      method: "GET",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(operatorPrivacyGet.status, 403);
    assert.ok(operatorPrivacyGet.body.error.includes("Forbidden"));

    // Operator token attempting POST /api/system/privacy-settings -> 403
    const operatorPrivacyPost = await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: { retentionPolicy: "ephemeral" },
    });
    assert.equal(operatorPrivacyPost.status, 403);

    // Admin Key authorized GET /api/system/privacy-settings -> 200
    const adminPrivacyGet = await request(testServer, {
      method: "GET",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
    });
    assert.equal(adminPrivacyGet.status, 200);
    assert.equal(adminPrivacyGet.body.success, true);
    assert.ok(adminPrivacyGet.body.settings.retentionPolicy);

    // Admin Key authorized POST /api/system/privacy-settings -> toggle to ephemeral
    const adminPrivacyToggleEphemeral = await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { retentionPolicy: "ephemeral", scrubSensitiveMedicalNotes: true },
    });
    assert.equal(adminPrivacyToggleEphemeral.status, 200);
    assert.equal(adminPrivacyToggleEphemeral.body.settings.retentionPolicy, "ephemeral");
    assert.equal(adminPrivacyToggleEphemeral.body.settings.scrubSensitiveMedicalNotes, true);

    // Admin Key authorized POST /api/system/privacy-settings -> toggle back to audited
    const adminPrivacyToggleAudited = await request(testServer, {
      method: "POST",
      path: "/api/system/privacy-settings",
      headers: { Authorization: `Bearer ${PANEL_API_SECRET}` },
      body: { retentionPolicy: "audited", scrubSensitiveMedicalNotes: false },
    });
    assert.equal(adminPrivacyToggleAudited.status, 200);
    assert.equal(adminPrivacyToggleAudited.body.settings.retentionPolicy, "audited");
    assert.equal(adminPrivacyToggleAudited.body.settings.scrubSensitiveMedicalNotes, false);
  });
});
