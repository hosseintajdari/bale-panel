import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, ".tmp");
const reportPath = path.join(reportDir, "project-control-report.json");

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function run(name, command, args) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "ignore",
    env: process.env,
  });
  return {
    name,
    command: [command, ...args].join(" "),
    passed: result.status === 0,
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
  };
}

const checks = [
  run("lint", "npm", ["run", "lint"]),
  run("test", "npm", ["test"]),
  run("build", "npm", ["run", "build"]),
];
const report = {
  generatedAt: new Date().toISOString(),
  git: {
    branch: git("branch", "--show-current"),
    head: git("rev-parse", "HEAD"),
    subject: git("log", "-1", "--format=%s"),
    clean: git("status", "--porcelain") === "",
  },
  checks,
  passed: checks.every((check) => check.passed),
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Project control: ${report.passed ? "PASS" : "FAIL"}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name} (${check.durationMs}ms)`);
}
process.exitCode = report.passed ? 0 : 1;
