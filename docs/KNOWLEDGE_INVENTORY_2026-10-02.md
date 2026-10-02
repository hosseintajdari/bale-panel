# Bale-Panel Technical Knowledge Inventory (Draft)

- Generated: 2026-10-02
- Repository: [https://github.com/hosseintajdari/bale-panel](https://github.com/hosseintajdari/bale-panel)
- HEAD: [`23cc534`](https://github.com/hosseintajdari/bale-panel/commit/23cc534)
- Tracking issue: [#19](https://github.com/hosseintajdari/bale-panel/issues/19)
- Notion writes: **not performed**; pages were read-only.

## Executive result
Code and GitHub are the technical source of truth. The current code baseline is modular Express/TypeScript with SQLite-backed state, RBAC, deterministic safety rules, shadow/HITL processing, authenticated webhooks, and a release evidence gate. Local code checks pass, but runtime release evidence is still missing.

## Architecture
- `server.ts` is a small bootstrap orchestrator.
- Domains in `src/server/`: auth, admin, bot, config, evolution, gateways, ledger, pipeline, rules, vault, webhooks, outbox.
- Flow: webhook → normalized message → deterministic rules → Gemini/fallback → privacy/ledger → shadow review → approved outbox dispatch.
- Dev uses Vite middleware; production serves `dist`; listener binds `127.0.0.1`.

## Technical decisions / ADR status
- Modular backend split: [`HANDOFF_BACKEND_MODULARIZATION.md`](https://github.com/hosseintajdari/bale-panel/blob/23cc534/docs/HANDOFF_BACKEND_MODULARIZATION.md).
- Deterministic rules before probabilistic generation: [`pipeline/engine.ts`](https://github.com/hosseintajdari/bale-panel/blob/23cc534/src/server/pipeline/engine.ts).
- RBAC roles: admin, operator, auditor.
- Shadow/HITL contract: [`api-contract.md`](https://github.com/hosseintajdari/bale-panel/blob/23cc534/docs/api-contract.md).
- Release gate distinguishes code checks from runtime evidence: [`RELEASE_READINESS.md`](https://github.com/hosseintajdari/bale-panel/blob/23cc534/docs/RELEASE_READINESS.md).
- No standalone ADR files were found; decisions are embedded in handoffs and `AGENTS.md`.

## API and webhook inventory
- Health: `GET /api/health`.
- Shadow contract: `POST /api/pipeline/ingest/shadow-trace`, `GET /api/pipeline/stream`, process/action/state routes.
- Bale: `POST /webhook/bale`; requires `x-telegram-bot-api-secret-token` and fails closed when the secret is absent or mismatched.
- Evolution: `POST /webhook/evolution`; required `x-evolution-webhook-secret`, fail-closed.
- Other route groups: auth, admin, vault, gateways, ledger, bot, evolution. See `src/server/*/routes.ts`.

## Security contracts
- No credentials in git.
- AES-256-GCM vault using `VAULT_MASTER_KEY`.
- Admin routes require authenticated session or bearer credential; master credential is not returned.
- Webhooks authenticate before processing and use constant-time secret comparison. Bale rejects requests when its secret is absent or mismatched.
- Personal/ephemeral high-privacy flows omit message content from inbound audit records; operational metadata may still be retained.
- Do not place secrets, raw messages, patient data, or private network details in GitHub evidence.

## Tests and release
- `npm test`: **PASS**, 25 tests, 0 failed.
- `npm run lint`: **PASS**.
- `npm run build`: **PASS**.
- `npm run control:check`: **PASS**.
- `npm run release:readiness`: code gate passes; **RUNTIME_EVIDENCE_REQUIRED** remains. This is not a deployment claim.

## GitHub history
- [Issue #12](https://github.com/hosseintajdari/bale-panel/issues/12): Evolution webhook authentication.
- [Issue #15](https://github.com/hosseintajdari/bale-panel/issues/15) / [PR #16](https://github.com/hosseintajdari/bale-panel/pull/16): project-control validation.
- [Issue #17](https://github.com/hosseintajdari/bale-panel/issues/17) / [PR #18](https://github.com/hosseintajdari/bale-panel/pull/18): release-readiness evidence gate.
- [Issues #13](https://github.com/hosseintajdari/bale-panel/issues/13) and [#14](https://github.com/hosseintajdari/bale-panel/issues/14) remain open follow-ups.
- This inventory: [Issue #19](https://github.com/hosseintajdari/bale-panel/issues/19).

## Notion comparison
Read and updated pages: [Bale-Panel project](https://app.notion.com/p/3d4834f066298182a6f7d5b36fd40a02), [system map](https://app.notion.com/p/692db7b0e2084a3494c0a85241ecc9d43), [release log](https://app.notion.com/p/78e834f0662983259a25811c94437cdf), [Bale webhook knowledge](https://app.notion.com/p/2e2834f06629823b9f63010dcd7d85e3).

Differences found:
1. Project page still points to Issue #1 and a 2026-09-22 synchronization context; current evidence is #15/#17, PR #16/#18, and `23cc534`.
2. The Bale webhook knowledge page describes a separate FastAPI `/opt/bale-bot` system. Current Bale-panel code is Express and uses a header secret.
3. Notion broadly claims circuit breakers/signature validation; code evidence confirms webhook secret checks but no generic circuit-breaker module was found.
4. Notion release log lacks the current readiness result and still must not imply runtime deployment.

## Draft knowledge changes
### New
- Current baseline: `23cc534`.
- Code checks are green; runtime evidence is missing.
- Issue #19 tracks reconciliation.
- Bale-panel and bale-auto webhook contracts are distinct.

### Obsolete / review
- Issue #1 and 2026-09-22 as current baseline.
- Unqualified circuit-breaker claim.
- Treating the FastAPI Bale page as this repository's implementation.

## Approval boundary
Notion was updated after explicit connector approval. Final Notion pages: [project](https://app.notion.com/p/3d4834f066298182a6f7d5b36fd40a02), [webhook knowledge](https://app.notion.com/p/2e2834f06629823b9f63010dcd7d85e3), and [release log](https://app.notion.com/p/78e834f0662983259a25811c94437cdf). Tracking evidence remains in [Issue #19](https://github.com/hosseintajdari/bale-panel/issues/19).
