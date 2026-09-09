# Handoff: Phase 2 — Real Gateway + SQLite Persistence
**تاریخ**: سپتامبر ۲۰۲۶
**وضعیت**: تغییرات اعمال شد — آماده تست با Bot Token واقعی

---

## تغییرات اعمال‌شده در فاز ۲

### ۱. Auth Hardening — Pipeline/Gateway/System Routes (server.ts)
قبل: `/api/pipeline/*`, `/api/gateways/*`, `/api/system/*`, `/api/evolution/*`, `/api/ledger/*` بدون احراز هویت بودند.
بعد: middleware `requireOperatorAuth` (Bearer Token با `PANEL_API_SECRET`) روی تمام این مسیرها اعمال شد.

### ۲. SQLite Persistence — shadow_queue + audit_logs
قبل: تمام داده‌های Shadow Queue و Audit Logs در RAM بود — restart = از دست رفتن داده.
بعد: ماژول `src/lib/db/database.ts` با `better-sqlite3` ایجاد شد.
- جداول: `shadow_queue`, `audit_logs`
- عملیات: `shadowDB.insert()`, `shadowDB.getAll()`, `shadowDB.getById()`, `shadowDB.updateStatus()`
- مسیر فایل DB: `./data/embednet.db` (خودکار ایجاد می‌شود)
- WAL mode فعال برای عملکرد بهتر

### ۳. Bale Bot Real Dispatcher (`src/lib/outbox/BaleDispatcher.ts`)
قبل: `dispatchToOutbox` فقط `console.log` بود.
بعد: کلاس `BaleDispatcher` با موارد زیر:
- `sendText()` — ارسال واقعی به Bale API (`tapi.bale.ai`)
- `sendTyping()` — نشانگر "در حال نوشتن"
- `healthCheck()` — بررسی اعتبار Bot Token
- `setWebhook()` / `deleteWebhook()` — مدیریت webhook
- Retry با exponential backoff (۳ تلاش)

### ۴. dispatchToOutbox واقعی
قبل: console.log فقط
بعد: مسیریابی واقعی بر اساس channel:
- `bale` → `BaleDispatcher.sendText()`
- `whatsapp` → Evolution API v2 (`EVOLUTION_API_URL`)
- `telegram` → Bot API مستقیم (`TELEGRAM_BOT_TOKEN`)
- هر dispatch در `audit_logs` SQLite ثبت می‌شود

### ۵. Bale Webhook Endpoint (`POST /webhook/bale`)
- دریافت پیام‌های واقعی از Bale Bot API
- تایید با `BALE_WEBHOOK_SECRET` (اختیاری اما پیشنهادی)
- ثبت در `audit_logs` و پاس دادن به `processPipelineMessage`
- Immediate acknowledgment (200 OK) قبل از processing

### ۶. Bale Health Check API
- `GET /api/admin/bale/health` — بررسی اعتبار Bot Token بدون نیاز به bot token از کاربر

---

## متغیرهای محیطی جدید (فاز ۲)

```
BALE_BOT_TOKEN=""          # از BotFather بله — REQUIRED برای dispatch واقعی
BALE_WEBHOOK_SECRET=""     # برای امنیت webhook — OPTIONAL
TELEGRAM_BOT_TOKEN=""      # از BotFather تلگرام
EVOLUTION_API_URL=""       # آدرس Evolution API v2 (self-hosted)
EVOLUTION_API_KEY=""       # کلید API Evolution
EVOLUTION_INSTANCE="embednet-wa-primary"
```

---

## پیاده‌سازی Bale Bot — مراحل بعدی

برای اتصال واقعی:

۱. توکن از BotFather بله دریافت شد: ربات `@b2balclawhbot` (شناسه: `1249156763`) ✅
۲. `BALE_BOT_TOKEN` در فایل `.env` محلی مقداردهی و در اتصال مستقیم به API تست شد ✅
۳. تنظیم Webhook جهت دریافت پیام‌های کاربران:
   ```bash
   curl -X POST "https://tapi.bale.ai/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook/bale", "secret_token": "..."}'
   ```
   یا از طریق health API پنل: `GET /api/admin/bale/health` (با هدر Bearer)

---

## مشکلات باقی‌مانده (فاز ۳)

| مشکل | اولویت |
|------|--------|
| ShadowQueue UI هنوز به `/api/pipeline/state` نیاز به header دارد | مهم |
| `gatewayAuditLogs` (in-memory) هنوز به SQLite migrate نشده | متوسط |
| bot sessions هنوز in-memory هستند | کم |
| Multi-tenant session isolation | کم |
