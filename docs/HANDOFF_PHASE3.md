# Handoff: Phase 3 — SQLite Full Migration & Operator Auth Integration
**تاریخ**: سپتامبر ۲۰۲۶
**وضعیت**: پیاده‌سازی کامل، بیلد پایدار، راه‌اندازی و تست در ویندوز ✅

---

## ۱. خلاصه‌ کارهای انجام‌شده در فاز ۳

### ۱.۱. حل مشکل Authentication در فرانت‌اند (ShadowQueue UI & Pipeline State)
- **ماژول کمکی `src/utils/api.ts` (`authFetch`)**:
  - ارسال درخواست‌های same-origin با cookie نشست HttpOnly.
  - هیچ credential اپراتور یا کلید اصلی به JavaScript فرانت‌اند منتقل نمی‌شود.
- **ایمن‌سازی ارتباطات فرانت‌اند در `src/App.tsx` و `src/components/GatewayHistoryTab.tsx`**:
  - روت‌های `/api/pipeline/state`، `/api/system/pulse-settings`، `/api/pipeline/shadow/action` و `/api/gateways/history` همگی با `authFetch` فراخوانی می‌شوند تا از خطای `401 Unauthorized` جلوگیری شود.
- احراز هویت UI از مسیر login و session-cookie انجام می‌شود؛ endpoint بازگردانندهٔ credential وجود ندارد.

### ۱.۲. مهاجرت کامل لاگ‌های گیت‌وی به پایگاه‌داده پایدار (`gatewayAuditLogs` به SQLite)
- آرایه موقت درون‌حافظه‌ای (`in-memory`) کاملاً حذف شد.
- تمام رخدادها، پالس‌ها و هشدارهای تله‌متری مستقیماً در جدول `audit_logs` پایگاه‌داده `better-sqlite3` ذخیره می‌شوند.
- افزودن متد قدرتمند `auditDB.queryFiltered()` برای فیلتر چندبعدی (کانال، نوع رویداد، شدت خطا، متن جستجو) و محاسبه داینامیک آمارهای سلامت (`stats`).
- متد `auditDB.seedIfEmpty()` جهت مقداردهی اولیه تاریخچه استاندارد در نخستین اجرا.

### ۱.۳. پایداری نشست‌های ربات و جداسازی چندمستاجری (Bot Sessions Persistence & Multi-Tenant)
- ایجاد جدول `bot_sessions` در `src/lib/db/database.ts` با ایندکس اختصاصی `(tenant_id, session_id, created_at)`.
- ماژول `sessionDB` با توابع `addMessage`, `getMessages`, `clearSession`.
- بازنویسی اندپوینت‌های `/api/bot/chat` و `/api/bot/clear` در `server.ts` بر پایه SQLite و پشتیبانی از هدر یا بدنه `x-tenant-id` (پیش‌فرض: `default`).
- مکالمات شبیه‌ساز پس از بستن یا ری‌استارت سرور از بین نخواهند رفت.

### ۱.۴. سازگاری محیط ویندوز و انعطاف پورت
- ارتقای پورت پیش‌فرض سرور در `server.ts` به صورت `process.env.PORT || 3001` (جلوگیری از تداخل با پورت ۳۰۰۰ که در ویندوز توسط بریج‌های پس‌زمینه دیگر اشغال بود).
- تست موفق اجرای پروداکشن در ویندوز روی پورت `3001`.

---

## ۲. وضعیت فعلی فایل‌ها و مخزن

| بخش | مسیر | وضعیت |
|---|---|---|
| دیتابیس پایدار | `src/lib/db/database.ts` | شامل `shadow_queue`, `audit_logs`, `bot_sessions` |
| کلاینت Auth | `src/utils/api.ts` | آماده و فعال |
| بک‌اند سرور | `server.ts` | متصل به SQLite، login/session، پورت 3001 |
| فرانت‌اند و تب‌ها | `src/App.tsx`, `src/components/GatewayHistoryTab.tsx` | یکپارچه با `authFetch` |
| بیلد پروداکشن | `dist/` | بیلد موفق بدون هیچ خطای TypeScript یا Bundling |

---

## ۳. مراحل پیشنهادی برای فاز بعدی (Next Phase / Future Agent)

۱. **ثبت رسمی Webhook بله روی دامنه معتبر**:
   - در صورت در دسترس قرار گرفتن URL اینترنتی (Cloudflare Tunnel یا سرور ابری)، فراخوانی `setWebhook` به اندپوینت `/webhook/bale`.
۲. **اتصال سوکت یا وب‌هوک واقعی Evolution API (واتساپ)**:
   - اتصال ماژول `EvolutionWhatsAppHub` به اینستنس لایو در محیط سرور اصلی.
۳. **پشتیبانی از نقش‌های دسترسی چندگانه (Multi-Role RBAC)**:
   - در صورت نیاز به افزودن اپراتورهای بدون دسترسی ادمین کامل، تفکیک توکن‌ها از `PANEL_API_SECRET` یکتا.
