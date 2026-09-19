# API Contract — Shadow Emit & Pipeline Integration
**Version**: 1.0 | **Phase**: 6a | **Refs**: Issue #8 (Phase 6a)

---

## 1. ShadowEmitPayload — قرارداد ارسال از bale-med

همه backend engineها (bale-med, bale-auto, Bale-EMS) باید با این فرمت به پنل POST کنند.

```json
{
  "engine_id": "bale-med-v2",
  "shadow_item": {
    "id": "sh-1726520000-abc12",
    "sessionId": "bale-09876543210",
    "channel": "bale",
    "senderDisplay": "داروخانه مرکزی / آقای احمدی",
    "userMessage": "قیمت آموکسی‌سیلین ۵۰۰ میلی‌گرم؟",
    "proposedReply": "قیمت مصوب: ۴۵,۰۰۰ تومان (بسته ۲۰ عددی). منبع: TTAC 1403.",
    "timestamp": "2026-09-17T00:00:00.000Z",
    "confidenceScore": 0.97,
    "riskLevel": "safe",
    "status": "pending",
    "deterministicRuleApplied": "qanoon-price-v3",
    "auditNote": null,
    "editedReply": null
  }
}
```

### فیلدهای اجباری
| فیلد | نوع | توضیح |
|---|---|---|
| `engine_id` | `string` | شناسه engine فرستنده |
| `shadow_item.id` | `string` | شناسه یکتا — format: `sh-{timestamp}-{rand5}` |
| `shadow_item.sessionId` | `string` | format: `{channel}-{chatId}` |
| `shadow_item.channel` | `"bale" \| "whatsapp" \| "telegram" \| "sms"` | کانال ارتباطی |
| `shadow_item.userMessage` | `string` | پیام اصلی کاربر |
| `shadow_item.proposedReply` | `string` | پاسخ پیشنهادی هوش مصنوعی |
| `shadow_item.timestamp` | `string` | ISO 8601 UTC |
| `shadow_item.riskLevel` | `"safe" \| "caution" \| "redline"` | سطح ریسک |

### فیلدهای اختیاری
| فیلد | نوع | پیش‌فرض |
|---|---|---|
| `shadow_item.confidenceScore` | `number (0–1)` | `0.9` |
| `shadow_item.status` | `"pending"` | همیشه `pending` هنگام ارسال |
| `shadow_item.deterministicRuleApplied` | `string \| null` | شناسه قانون اعمال‌شده |
| `shadow_item.auditNote` | `string \| null` | یادداشت اضافه |

---

## 2. Endpoints

### POST `/api/pipeline/ingest/shadow-trace`
> **Auth**: `Authorization: Bearer <OPERATOR_TOKEN>` (اجباری)

**Request**: `ShadowEmitPayload` (بالا)

**Response 200**:
```json
{ "success": true, "message": "Shadow record ingested." }
```

**Response 400**: فیلد اجباری ناقص
**Response 401**: توکن نامعتبر

---

### GET `/api/pipeline/stream`
> **Auth**: `Authorization: Bearer <OPERATOR_TOKEN>` (اجباری)
> **Content-Type**: `text/event-stream`

پخش real-time همه تغییرات shadow queue به فرانت (SSE).

**Event format**:
```
event: shadow-update
data: {"type":"new","record":{...ShadowRecord}}

event: shadow-update
data: {"type":"action","id":"sh-xxx","status":"approved"}

event: ping
data: {"ts":"2026-09-17T00:00:00.000Z"}
```

**Heartbeat**: هر ۳۰ ثانیه یک `ping` event ارسال می‌شود تا connection زنده بماند.

---

### GET `/api/health`
> **Auth**: بدون نیاز

**Response 200**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-09-17T00:00:00.000Z",
  "db": "connected",
  "queueSize": 3
}
```

---

## 3. راهنمای پیاده‌سازی در bale-med

```typescript
// shadow_emitter.ts در bale-med
import fetch from 'node-fetch';

const PANEL_URL = process.env.PANEL_BASE_URL ?? 'http://localhost:3000';
const PANEL_TOKEN = process.env.PANEL_OPERATOR_TOKEN;

export async function emitShadowRecord(payload: ShadowEmitPayload) {
  const res = await fetch(`${PANEL_URL}/api/pipeline/ingest/shadow-trace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PANEL_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Panel ingest failed: ${res.status}`);
  return res.json();
}
```

**متغیرهای محیطی مورد نیاز در bale-med**:
```env
PANEL_BASE_URL=http://localhost:3000
PANEL_OPERATOR_TOKEN=<توکن عملیاتی>
```
