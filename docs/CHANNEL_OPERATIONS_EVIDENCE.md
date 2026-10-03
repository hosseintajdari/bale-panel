# Channel operations evidence — Issue #21

Reviewed: 2026-10-03. Source commit: [23cc534bce4004c710beb2c533a645683e2de49e](https://github.com/hosseintajdari/bale-panel/commit/23cc534bce4004c710beb2c533a645683e2de49e).
Scope: static analysis only. No application startup, tests, provider requests, credential inspection, webhook registration, deployment, or runtime verification was performed.
Notion's current contents were not independently fetched; this report uses repository evidence only.

## Status semantics

These are independent dimensions:
- configured: runtime configuration presence is evidenced, without revealing values.
- unconfigured: required runtime configuration is evidenced absent.
- code-verified: a concrete implementation was inspected; this does not mean tests were executed or delivery succeeded.
- runtime-verified: sanitized observed execution evidence exists for the reviewed release.
- blocked: a specific missing implementation, failed guard, or missing evidence prevents acceptance.

Runtime configuration was not inspected. Therefore configured/unconfigured is **unknown**, not inferred from defaults, UI state, templates, or mocks.

## Channel status matrix

| Channel | configured / unconfigured | code-verified | runtime-verified | Blockers / gaps |
|---|---|---|---|---|
| WhatsApp | Unknown. Outbound requires EVOLUTION_API_URL and EVOLUTION_API_KEY; instance has a default. Inbound requires EVOLUTION_WEBHOOK_SECRET. | Evolution webhook parses messages.upsert; outbound sendText exists. | Not verified. | Missing webhook secret rejects with 403; missing outbound config returns false. Pairing/status UI state does not prove provider connectivity. |
| Bale | Unknown. Outbound requires BALE_BOT_TOKEN. Inbound secret configuration is defined. | Bale webhook feeds shadow pipeline; sendMessage dispatcher and webhook registration exist. | Not verified. | Missing token fails dispatch. Missing webhook secret currently allows ingress. Registration accepts a request secret overriding the configured secret, permitting mismatch. |
| Telegram | Unknown. Outbound requires TELEGRAM_BOT_TOKEN. | Outbound sendMessage exists. No dedicated Telegram ingress webhook was found in reviewed server routes. | Not verified. | Ingress incomplete; missing token fails dispatch. UI standby/active is not connectivity evidence. |
| SMS | Runtime configuration unknown; provider integration absent in reviewed dispatcher. | Display and no-op branch only; delivery not implemented. | Not verified. | No provider send or delivery receipt implementation. No-op returns true and may produce a false successful-send audit. |

Evidence: [webhook routes](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/webhooks/routes.ts), [outbox dispatcher](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/outbox/dispatcher.ts), [Bale admin routes](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/admin/routes.ts), [configuration](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/config.ts), [Evolution routes](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/evolution/routes.ts), [server router mounting](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/server.ts).

## Operational contracts

| Channel | Latency | Queue | Error | Retry | Audit |
|---|---|---|---|---|---|
| WhatsApp | Outbound timeout 10s; no measured end-to-end latency target. Dashboard pulse is simulated. | Dashboard counts pending shadow review records, not a durable delivery outbox. | Auth failure 403. Authenticated webhook acknowledges 200 before processing; subsequent errors are logged. Outbound failures return false. | No outbound retry loop. | Outbound attempt persisted best-effort; no proof of recipient delivery. |
| Bale | getMe health timeout 5s. sendMessage has no explicit timeout. Dashboard pulse simulated. | Pending shadow review count, not delivery queue. | Configured secret mismatch 403; absent secret bypasses validation. Webhook acknowledges before processing. API ok:false returns failed result. | At most 3 total attempts; waits 1s then 2s after exceptions. HTTP 4xx, including 429, is not retried; ok:false is not retried. | Inbound and outbound attempts recorded; logs/audit include user identifiers and message excerpts. |
| Telegram | Outbound timeout 10s; dashboard pulse simulated. | Dashboard value is constant zero. | API ok:false or exception becomes outbound failure; missing token returns false. | No retry loop. | Shared outbound audit only; ingress and delivery receipts not established. |
| SMS | Dashboard pulse simulated; no provider timeout contract. | Dashboard value is constant zero. | Unimplemented/no-op dispatch returns true. | None implemented. | Shared audit can claim successful send despite no provider operation. |

Evidence: [Bale dispatcher](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/lib/outbox/BaleDispatcher.ts), [shared dispatcher](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/outbox/dispatcher.ts), [gateway state](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/gateways/state.ts), [gateway pulse routes](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/gateways/routes.ts), [SQLite schema and audit helpers](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/lib/db/database.ts).

## Acceptance gaps

1. Pulse latency/jitter values are hardcoded or randomized. A normal pulse operation can generate a successful heartbeat audit without contacting providers. active/standby/disconnected is mutable in-memory state, not evidence of configuration or connectivity.
2. Audit storage has seed/demo records. SQLite persistence alone does not establish event provenance. Audit writes are best-effort; failed writes do not fail dispatch.
3. The shadow approve/modify handler ignores the dispatch boolean, then records approved/modified and sent wording even after failed delivery. The live pipeline also appends sent wording without checking the dispatch result.
4. No durable outbound delivery queue, explicit deduplication contract based on provider event IDs, dead-letter handling, delivery receipt contract, or measured end-to-end latency objective was established in the reviewed paths.
5. Bale webhook fails open when its secret is absent, and registration can choose a different secret. These observations refer to the reviewed main commit, not an unmerged fix.
6. Automated tests explicitly enable MOCK_OUTBOX. Their source establishes mock test coverage, not real provider delivery. Tests were read, not executed in this review.

Evidence: [pipeline actions](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/pipeline/routes.ts), [pipeline engine](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/src/server/pipeline/engine.ts), [test source](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/tests/modular_backend.test.ts), plus the linked gateway, webhook, dispatcher, and database files above.

## Release evidence boundary

[RELEASE_READINESS.md](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/docs/RELEASE_READINESS.md) separates code readiness from runtime evidence. [release-readiness.mjs](https://github.com/hosseintajdari/bale-panel/blob/23cc534bce4004c710beb2c533a645683e2de49e/scripts/release-readiness.mjs) does not contact providers; runtime evidence is an operator-supplied marker, not an independently verified channel result. Its configuration checks cover Bale/Evolution and shared secrets, not Telegram/SMS.

RUNTIME_EVIDENCE_REQUIRED remains an unresolved evidence boundary for this review. This report does not claim to have read a fresh generated readiness report or verified its status.

## One next action

Review this documentation-only PR against Issue #21, confirming that simulated telemetry, unknown configuration, partial implementations, and unverified runtime evidence remain explicitly distinguished. Do not promote any channel to runtime-verified based on this report.
