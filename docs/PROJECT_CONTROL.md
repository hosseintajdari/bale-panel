# Project Control Loop

Run `npm run control:check` before a release, pull request, or status update.

The command writes `.tmp/project-control-report.json` with only:

- current branch, commit, and commit subject;
- working-tree cleanliness;
- pass/fail and duration for lint, test, and build.

The report never records environment-variable values, tokens, message content, chat IDs, or database contents. `npm test` loads `tests/test-env.ts`, which provides non-production test values and uses an isolated SQLite file under `.tmp/`.

## Prime operating loop

1. Inspect GitHub and run `npm run control:check`.
2. Compare the safe report with the EmbedNet OS Notion project, actions, and critical-path records.
3. Draft a status update with evidence and blockers.
4. Apply a Notion or GitHub write only after the required connector approval.
5. Record the resulting commit, validation result, deployment state, uncertainty, and safe next action in the issue.
