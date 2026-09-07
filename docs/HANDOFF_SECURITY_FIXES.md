# Handoff: Security Hardening — Embednet OS Panel
**تاریخ**: سپتامبر ۲۰۲۶
**وضعیت**: تغییرات اعمال شد — آماده تست و استقرار

---

## تغییرات اعمال‌شده

### 1. Startup Env Validation (خط 10-21 server.ts)
قبل: سرور با هر حالتی بالا می‌آمد، حتی بدون VAULT_MASTER_KEY.
بعد: اگر VAULT_MASTER_KEY یا PANEL_API_SECRET نباشند، سرور فوری crash می‌کند.

### 2. Admin Auth Middleware — Bearer Token (خط 28-48 server.ts)
قبل: تمام /api/admin/* endpoints بدون احراز هویت باز بودند.
بعد: middleware requireAdminAuth روی app.use("/api/admin") اعمال شد.
هر request به /api/admin/* باید header زیر را داشته باشد:
  Authorization: Bearer <PANEL_API_SECRET>

Routes محافظت‌شده:
- GET  /api/admin/integrations
- POST /api/admin/integrations/toggle
- POST /api/admin/sandbox/create
- GET  /api/admin/auth-credentials
- POST /api/admin/auth-credentials
- DELETE /api/admin/auth-credentials/:id
- POST /api/admin/auth-credentials/test/:id
- GET  /api/admin/auth-credentials/env-export

### 3. Vault Master Key — No Hardcoded Fallback
قبل: const VAULT_MASTER_SECRET = process.env.VAULT_MASTER_KEY || "embednet-vault-master-key-seed-2026-secure";
بعد: const VAULT_MASTER_SECRET = process.env.VAULT_MASTER_KEY!;

### 4. Hardcoded Fake Credentials — حذف کامل
قبل: سه credential جعلی (GitHub, Notion, OpenAI) مستقیم در کد.
بعد: vault از .env seed می‌شود — اگر GITHUB_TOKEN/NOTION_API_KEY/OPENAI_API_KEY باشند، رمزنگاری می‌شوند؛ وگرنه vault خالی.

### 5. env-export Endpoint — حذف VAULT_MASTER_KEY از خروجی
قبل: VAULT_MASTER_KEY در response بود.
بعد: فقط encrypted blobs. کلید اصلی هرگز از API خارج نمی‌شود.

### 6. Model Name Fix
قبل: "gemini-3.7-flash" (وجود ندارد) — 6 بار در server.ts
بعد: "gemini-2.0-flash" — همه موارد اصلاح شدند

---

## اقدام فوری برای راه‌اندازی

```
cp .env.example .env
# پر کردن:
# GEMINI_API_KEY   → از aistudio.google.com
# PANEL_API_SECRET → node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# VAULT_MASTER_KEY → همان دستور بالا (مقدار جداگانه)
npm install
npm run dev
```

---

## مشکلات باقی‌مانده (فاز بعدی)

| مشکل | اولویت |
|------|--------|
| /api/pipeline/*, /api/system/*, /api/gateways/* بدون auth | مهم |
| dispatchToOutbox فقط console.log است — اتصال واقعی ندارد | مهم |
| همه state در RAM — restart = از دست رفتن داده‌ها | مهم |
| bot-simulator routes با pipeline routes در یک فایل | کم اهمیت |

---

## فاز بعدی پیشنهادی

گزینه A: اتصال واقعی Bale Bot
- گرفتن bot token از BotFather در Bale
- پیاده‌سازی واقعی dispatchToOutbox برای Bale
- تست pipeline کامل: webhook → shadow review → approve → ارسال واقعی

گزینه B: Persistence
- SQLite با better-sqlite3 برای shadowQueue و auditLogs
- بدون تغییر در API — فقط in-memory را با SQLite جایگزین کنیم
