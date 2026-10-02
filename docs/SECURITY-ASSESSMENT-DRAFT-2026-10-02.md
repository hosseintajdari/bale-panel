# Security Assessment — Draft (Bale Panel)

**Status:** Draft only. Not approved for Notion publication.
**Scope:** Git secrets, environment/key files, RBAC/routes, vault encryption, webhook authentication, fail-closed behavior, log privacy, and dependencies.
**Commit baseline:** `27164a6` before remediation; remediation branch: `security/p0-bale-webhook-secret`.

## Executive decision

The Bale webhook was **not secure by default**. Before remediation, an environment with no `BALE_WEBHOOK_SECRET` returned HTTP 200 and processed a sanitized probe message. The required architecture is fail-closed webhook authentication: an unset or mismatched secret must return 403 before pipeline processing. This is tracked in GitHub issue #22.

## Findings

### P0 — Bale webhook accepted unauthenticated traffic when the secret was unset

- **Evidence (sanitized):** Before the fix, `src/server/webhooks/routes.ts:58-71` guarded verification with `if (BALE_WEBHOOK_SECRET)`. A runtime probe with the variable absent received `200 {"ok":true}` and emitted the inbound processing log. No secret values were collected or printed.
- **Impact:** Anyone able to reach `POST /webhook/bale` could forge updates, create audit/pipeline records, and trigger downstream processing.
- **Remediation:** On branch `security/p0-bale-webhook-secret`, reject an unset secret with 403, preserve constant-time comparison, mark the variable required in `.env.example`, and document the deployment contract. PR and CI gates are required before merge.
- **Rollback:** Revert the remediation commit/PR. Do not restore an unauthenticated endpoint without an approved architecture decision.
- **Acceptance test:** Missing secret, missing header, and wrong header return 403; configured correct header returns 200; lint, test, build, control check, and CI pass.
- **Tracking:** GitHub issue #22.

### P0 — Unauthenticated bot routes and caller-controlled tenant/session identity require separate remediation

- **Evidence:** `server.ts` mounts `botRouter` without a route-group auth guard. `src/server/bot/routes.ts` accepts `x-tenant-id`, body `tenantId`, and caller-supplied `sessionId`, and exposes chat, session overview, clear, note/memory, and code-generation routes.
- **Impact:** Depending on deployment exposure, an unauthenticated caller may invoke paid AI operations and access or mutate data for a chosen tenant/session.
- **Remediation:** Put sensitive bot routes behind explicit RBAC, derive tenant identity from authenticated principal, and add cross-tenant authorization tests. Keep public health separate.
- **Rollback:** Revert only after preserving route-level authorization and tenant-isolation tests.
- **Acceptance test:** Anonymous requests are rejected; an authenticated principal cannot read, write, or clear another tenant; health remains intentionally public.
- **Status:** Finding confirmed by code review; no fix claimed in this PR.

### P1 — Log and persistence paths retain raw or identifying message data

- **Evidence:** `src/server/webhooks/routes.ts:84-100` logs sender identity and stores message text; `src/server/outbox/dispatcher.ts:9-16,91-94` logs recipients and message prefixes; pipeline/ledger/shadow records can retain raw text outside ephemeral mode.
- **Impact:** Sensitive or medical content may enter stdout, SQLite, audit UI, and backups.
- **Remediation:** Define a field-level data classification, redact identifiers/content in logs, enforce retention and access controls, and add tests proving sensitive fields are scrubbed in each privacy mode.
- **Rollback:** Revert the redaction change only with an approved privacy exception and equivalent controls.
- **Acceptance test:** Synthetic sensitive markers do not appear in logs/audit details for configured privacy mode; authorized audit views retain only approved metadata.
- **Status:** Finding confirmed; no fix claimed in this PR.

### P1 — Vault status response is not evidence-based

- **Evidence:** `src/server/vault/routes.ts:13` returns `masterKeyConfigured: true` unconditionally. AES-256-GCM encryption and tamper detection are covered by tests, but the credential store is process-memory backed (`src/server/vault/store.ts`).
- **Impact:** Operators can be told encryption is configured when runtime state does not prove it; restart loses vault records.
- **Remediation:** Report configuration from validated runtime state, fail startup when the key is absent, and choose an encrypted persistent store or explicitly document non-persistence.
- **Rollback:** Revert only the status/persistence migration with a tested backup and restore path.
- **Acceptance test:** Status reflects actual key configuration; tampered ciphertext fails; restart behavior matches the documented persistence contract.
- **Status:** AES-256-GCM integrity passes current tests; status/persistence gap remains open.

### P2 — Dependency and tracked-secret controls

- **Evidence:** `git ls-files` found only `.env.example` among environment/key candidates; no non-placeholder credential pattern was found. `npm audit --omit=dev` reported zero vulnerabilities. `npm run control:check` passed.
- **Impact:** No current P0/P1 finding from this check. Placeholder examples are excluded from release secret scanning.
- **Remediation:** Keep CI secret scanning and dependency audit gates enabled; rotate any secret if ever committed outside placeholders.
- **Rollback:** Not applicable.
- **Acceptance test:** CI blocks tracked `.env`, key files, and credential patterns; dependency audit remains clean or has an approved exception.

## Control matrix

| Control | Result | Evidence |
|---|---|---|
| Tracked Git secrets | Pass (current tree) | `git ls-files`, release secret scan |
| `.env` and key files | Pass (tracked-file scope) | `.gitignore`; no tracked `.env`/`.pem`/`.key` |
| RBAC/protected routes | Partial | Admin/operator/auditor guards and tests pass; bot group needs review |
| Vault encryption | Partial pass | AES-256-GCM round-trip/tamper tests pass; status/persistence gap remains |
| Webhook authentication | Partial | Evolution fail-closed; Bale fixed on branch, not merged |
| Fail-closed behavior | Partial | Evolution and remediated Bale path reject absent secrets; production runtime evidence still required |
| Log privacy | Fail / P1 | Raw/identifying content appears in selected logs and audit fields |
| Dependency audit | Pass | `npm audit --omit=dev`: 0 vulnerabilities |

## Verification gates

- `npm ci`: passed; install emitted only non-security script warnings.
- `npm run control:check`: passed before remediation.
- `npm run release:readiness`: `RUNTIME_EVIDENCE_REQUIRED`; this is not a release approval.
- Notion publication: **blocked pending connector approval**. This file is the local draft only.
