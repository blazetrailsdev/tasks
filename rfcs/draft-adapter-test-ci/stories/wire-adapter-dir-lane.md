---
title: "Wire the live-DB adapter-dir lane into CI"
status: ready
rfc: "draft-adapter-test-ci"
cluster: ci-lane
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The live-DB adapter suites are excluded from the shared vitest run and so never
ran in CI. The bucket-fix campaign brought them to **0 failures** (PG + MySQL),
and the `RUN_ADAPTER_DIRS=1` gate (drops `ADAPTER_SPECIFIC_EXCLUDE` for one
process) is on `main`. This is the last step: turn the lane on. See this RFC
§Design (`ci-lane`). Lands in the **trails** repo (`.github/workflows/ci.yml`).

## Acceptance criteria

- [ ] `postgres-tests` job gains a second vitest step (own process,
      `RUN_ADAPTER_DIRS=1`, `AR_DB_FORKS=4`, `PG_TEST_URL`) running
      `adapters/postgresql` + `tasks/postgresql-database-tasks.test.ts` only
      (not the already-shared `connection-adapters/postgresql/**`).
- [ ] `mysql-tests` job gains the mirror step (`MYSQL_TEST_URL`) running
      `adapters/abstract-mysql-adapter`, `adapters/mysql2`,
      `connection-adapters/mysql`, and explicitly
      `tasks/mysql-database-tasks.test.ts`.
- [ ] PG step is a **hard gate** (0 failures today); MySQL per the §Open
      questions decision (hard gate vs one `continue-on-error` shakedown run).
- [ ] No double-run of `connection-adapters/postgresql/**` or top-level
      `postgresql-adapter*.test.ts` (already in the shared suite).
- [ ] Prototype jobs from PR #2863 (`*-adapter-tests`, do-not-merge) not added —
      this relocates the step into the existing jobs.

## Notes

Verify locally with the `RUN_ADAPTER_DIRS=1` recipe (raw `docker run` postgres:17
/ mysql:8) before flipping the gate. Reuses the existing service container +
`pnpm build` — no extra runner slot.
