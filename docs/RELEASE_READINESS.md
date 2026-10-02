# Release readiness gate

Run the code-evidence gate:

```bash
npm run release:readiness
```

It runs lint, tests, and build; scans tracked non-test source for common credential formats without printing values; and writes these ignored local artifacts:

- `.tmp/release-readiness-report.json`
- `.tmp/release-readiness-report.md`

The default **code** mode passes only code-quality and tracked-secret gates. Missing runtime configuration is reported as `RUNTIME_EVIDENCE_REQUIRED`; it does not claim a deployment is ready.

Before a real release, provide runtime variables through the deployment environment (never command history or Git), record sanitized gateway evidence, then run:

```bash
RELEASE_READINESS_MODE=release RELEASE_RUNTIME_EVIDENCE=verified npm run release:readiness
```

Release mode fails unless the required runtime configuration is present and the operator has marked live gateway/webhook evidence as verified. It does not contact a gateway, register a webhook, or deploy.

## Prime to Notion handoff

Prime may read the two reports and prepare a Notion draft. Publish it only after the Notion connector requests and receives approval. The report includes code evidence, runtime blockers, rollback commit, and a safe next action; it never includes secret values.
