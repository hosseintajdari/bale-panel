# Handoff: Phase 4 — Multi-Role RBAC, Scoped API Keys, Webhook Integration & Linear UI/UX
**تاریخ**: سپتامبر ۲۰۲۶ (شهریور ۱۴۰۵)
**وضعیت**: پیاده‌سازی کامل، بیلد پایدار، تست اعتبارسنجی موفق ✅

---

## ۱. خلاصه‌ کارهای انجام‌شده در فاز ۴

### ۱.۱. سیستم کنترل دسترسی چندسطحی (Multi-Role RBAC)
- **جدول `api_keys` در دیتابیس پایدار SQLite (`src/lib/db/database.ts`):**
  - فیلدهای: `id`, `token_hash` (یکتا و هش‌شده با SHA-256), `name`, `role` (`admin` | `operator` | `auditor`), `tenant_id`, `created_at`, `last_used_at`.
  - ایندکس اختصاصی `idx_api_keys_hash` برای اعتبارسنجی سریع و کم‌هزینه.
  - ماژول `apiKeyDB` با متدهای `createKey`, `validateKey`, `listKeys`, `deleteKey`.

### ۱.۲. گیت‌های احراز هویت هوشمند در `server.ts`
- **تفکیک سلسله‌مراتبی دسترسی‌ها:**
  - `requireAdminAuth`: دسترسی ادمین کامل به مدیریت والت و تنظیمات کلیدی سرور.
  - `requireOperatorAuth`: تایید یا رد پیام‌های صف `ShadowQueue` و کار با سشن‌های ربات و شبیه‌ساز ورودی واتساپ.
  - `requireAuditorAuth`: دسترسی نظارتی و فقط‌خواندنی به لاگ‌ها، پالس‌ها و تله‌متری سلامت گیت‌وی‌ها.
- **پشتیبانی دوگانه:** پذیرش کلید اصلی `PANEL_API_SECRET` به عنوان سوپرادمین همراه با کلیدهای تفکیک‌شده ذخیره‌شده در دیتابیس.

### ۱.۳. اندپوینت‌های مدیریت کلیدها، شبیه‌ساز ورودی و فعال‌سازی وب‌هوک
- `GET /api/admin/keys`: فهرست کلیدهای فعال همراه با نقش و تاریخ استفاده (بدون افشای هش یا توکن).
- `POST /api/admin/keys`: ایجاد کلید جدید با پیشوند `emb_<role>_<random_hex>` و بازگرداندن توکن متنی برای اولین و آخرین بار.
- `DELETE /api/admin/keys/:id`: ابطال و حذف آنی کلید.
- `POST /api/admin/bale/set-webhook`: ثبت مستقیم URL وب‌هوک بله روی API رسمی بات همراه با `secret_token`.
- `POST /api/evolution/inbound-message`: اندپوینت کامل شبیه‌سازی و دریافت وب‌هوک پیام‌های واتساپ با رعایت ۳ اصل ضد مسدودی (Strict Inbound، Persist-First در WorkLedger، تاخیر تصادفی انسانی).

### ۱.۴. هماهنگی فرانت‌اند و یکپارچه‌سازی با زبان طراحی استاندارد ۲۰۲۶ (Linear / Raycast)
- اتصال تمام درخواست‌های ماژول `EvolutionWhatsAppHub.tsx` به `authFetch` جهت جلوگیری از خطای ۴۰۱ با هدر `Authorization: Bearer <TOKEN>`.
- ارتقای رابط کاربری `EvolutionWhatsAppHub` به زبان طراحی مهندسی (Dark Matte، فونت Fira Code، کنترل‌های انگلیسی و ایزولاسیون متن فارسی پیام‌ها در کانتینر RTL).
- تکمیل استودیو مدیریت کلیدهای RBAC در تب Vault & Keys (`McpAccountsGrid.tsx`).

### ۱.۵. تست خودکار و بیلد پروداکشن
- اعتبارسنجی ایجاد، تطبیق نقش، تفکیک مستاجر و ابطال کلید در محیط Node.js بدون خطا.
- بیلد موفق Vite + esbuild پروداکشن در مسیر `dist/` (`npm run build` کد خروج ۰).

---

## ۲. وضعیت فعلی فایل‌ها و مخزن

| بخش | مسیر | وضعیت |
|---|---|---|
| دیتابیس و مدل RBAC | `src/lib/db/database.ts` | جدول `api_keys` و متدهای `apiKeyDB` |
| بک‌اند سرور و میدل‌ورها | `server.ts` | میدل‌ورهای RBAC، روت‌های کلید، اندپوینت اینباند و وب‌هوک بله |
| رابط کاربری درگاه واتساپ | `src/components/EvolutionWhatsAppHub.tsx` | ارتقا به Linear UI و یکپارچه با `authFetch` |
| کنسول کلیدها و وب‌هوک | `src/components/McpAccountsGrid.tsx` | متصل به اندپوینت‌های `/api/admin/keys` |
| سند تحویل فاز ۴ | `docs/HANDOFF_PHASE4.md` | مستندسازی کامل تغییرات |
| سند بازطراحی UI/UX | `docs/HANDOFF_UIUX_2026.md` | استاندارد طراحی و الزامات مهندسی |
| بیلد پروداکشن | `dist/` | بیلد موفق بدون هیچ خطای TypeScript یا Bundling |
