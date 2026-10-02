import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, ".tmp");
const mode = process.env.RELEASE_READINESS_MODE === "release" ? "release" : "code";

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function run(name, command, args) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, { cwd: root, stdio: "ignore", env: process.env });
  return { name, passed: result.status === 0, exitCode: result.status, durationMs: Date.now() - startedAt };
}

function findTrackedSecretRisks() {
  const tracked = git("ls-files").split("\n").filter(Boolean);
  const forbiddenFiles = tracked.filter((file) =>
    file !== ".env.example" && /(^|\/)\.env(?:\.|$)|\.(?:pem|key)$/i.test(file)
  );
  const patterns = {
    githubClassic: /ghp_[A-Za-z0-9]{36,}/,
    githubFineGrained: /github_pat_[A-Za-z0-9_]{20,}/,
    openAI: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
    notion: /secret_[A-Za-z0-9]{20,}/,
  };
  const matches = [];
  for (const file of tracked) {
    if (file.startsWith("tests/") || /\.(?:png|jpg|jpeg|gif|webp|pdf|lock)$/i.test(file)) continue;
    let content;
    try { content = fs.readFileSync(path.join(root, file), "utf8"); } catch { continue; }
    for (const [kind, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match && !/x{8,}/i.test(match[0])) matches.push({ file, kind });
    }
  }
  return { passed: forbiddenFiles.length === 0 && matches.length === 0, forbiddenFiles, matches };
}

const checks = [
  run("lint", "npm", ["run", "lint"]),
  run("test", "npm", ["test"]),
  run("build", "npm", ["run", "build"]),
];
const secretScan = findTrackedSecretRisks();
const configured = (name) => typeof process.env[name] === "string" && process.env[name].trim().length > 0;
const environment = {
  panelApiSecretConfigured: configured("PANEL_API_SECRET"),
  vaultMasterKeyConfigured: configured("VAULT_MASTER_KEY"),
  baleBotTokenConfigured: configured("BALE_BOT_TOKEN"),
  baleWebhookSecretConfigured: configured("BALE_WEBHOOK_SECRET"),
  evolutionUrlConfigured: configured("EVOLUTION_API_URL"),
  evolutionApiKeyConfigured: configured("EVOLUTION_API_KEY"),
  evolutionInstanceConfigured: configured("EVOLUTION_INSTANCE"),
  evolutionWebhookSecretConfigured: configured("EVOLUTION_WEBHOOK_SECRET"),
};
const runtimeEvidenceVerified = process.env.RELEASE_RUNTIME_EVIDENCE === "verified";
const runtimeBlockers = [];
for (const [name, configured] of Object.entries(environment)) {
  if (!configured) runtimeBlockers.push(`${name} is not configured in this release environment`);
}
if (!runtimeEvidenceVerified) runtimeBlockers.push("live gateway/webhook verification evidence is not marked verified");

const head = git("rev-parse", "HEAD");
let rollbackCommit = null;
try {
  rollbackCommit = git("rev-parse", "HEAD^");
} catch {
  // A shallow clone may not contain a parent commit. Report it as unavailable, not a script crash.
}
const codeReady = checks.every((check) => check.passed) && secretScan.passed;
const releaseReady = codeReady && runtimeBlockers.length === 0;
const report = {
  generatedAt: new Date().toISOString(),
  mode,
  status: releaseReady ? "READY" : codeReady ? "RUNTIME_EVIDENCE_REQUIRED" : "BLOCKED",
  git: { branch: git("branch", "--show-current"), head, clean: git("status", "--porcelain") === "" },
  checks,
  secretScan,
  webhookPolicy: {
    evolution: "fail-closed when EVOLUTION_WEBHOOK_SECRET is absent or mismatched",
    bale: "fail-closed when BALE_WEBHOOK_SECRET is absent or mismatched; release requires that variable and live verification evidence",
  },
  environment,
  runtimeEvidenceVerified,
  blockers: [...(codeReady ? [] : ["one or more code-quality gates failed or a tracked-secret risk was found"]), ...runtimeBlockers],
  rollback: rollbackCommit
    ? { targetCommit: rollbackCommit, command: `git revert --no-edit ${head}` }
    : { targetCommit: null, command: null, note: "Parent commit is unavailable in this clone; fetch history before rollback." },
  codeReady,
  releaseReady,
  notionDraft: {
    status: releaseReady ? "Ready for approved Notion publication" : "Draft only — do not publish as release-ready",
    evidence: checks.map(({ name, passed }) => `${name}: ${passed ? "passed" : "failed"}`),
    safeNextAction: releaseReady
      ? "Request connector approval, then publish this evidence to Notion."
      : "Collect sanitized runtime gateway evidence and rerun with RELEASE_READINESS_MODE=release RELEASE_RUNTIME_EVIDENCE=verified.",
  },
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "release-readiness-report.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# Release Readiness Report",
  "",
  `- Status: **${report.status}**`,
  `- Mode: ${mode}`,
  `- Commit: ${head}`,
  `- Working tree clean: ${report.git.clean}`,
  "",
  "## Code evidence",
  ...checks.map((check) => `- ${check.name}: ${check.passed ? "passed" : "failed"} (${check.durationMs}ms)`),
  `- Tracked-secret scan: ${secretScan.passed ? "passed" : "blocked"}`,
  "",
  "## Runtime blockers",
  ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
  "",
  "## Rollback",
  `- Target: ${report.rollback.targetCommit ?? "unavailable in this clone"}`,
  `- Command: ${report.rollback.command ? `\`${report.rollback.command}\`` : "fetch history before preparing rollback"}`,
  "",
  "## Notion handoff",
  `- ${report.notionDraft.status}`,
  `- ${report.notionDraft.safeNextAction}`,
  "",
].join("\n");
fs.writeFileSync(path.join(reportDir, "release-readiness-report.md"), markdown);
console.log(`Release readiness: ${report.status}`);
console.log("Reports: .tmp/release-readiness-report.{json,md}");
process.exitCode = mode === "release" ? (releaseReady ? 0 : 1) : (codeReady ? 0 : 1);
