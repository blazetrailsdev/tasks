---
title: "Wire the live-DB adapter-dir lane into CI"
status: ready
rfc: "0000-adapter-test-ci"
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

The live-DB adapter suites are excluded from the shared vitest run
(`ADAPTER_SPECIFIC_EXCLUDE`, `vitest.config.ts:34`, applied at
`vitest.config.ts:187`) and so never ran in CI. The bucket-fix campaign brought
them to **0 failures** (PG + MySQL — RFC §Done), and the `RUN_ADAPTER_DIRS=1`
gate that drops the exclude for one process (`vitest.config.ts:32-35`) is on
`main`. This is the last step: turn the lane on, mirroring Rails running each
adapter's `test/cases/adapters/<db>/` suite in its own process under that
backend. See RFC §Design (`ci-lane`). Lands in **trails** `.github/workflows/ci.yml`.

## Acceptance criteria

- [ ] **Re-run the probe on current `main` first** (`RUN_ADAPTER_DIRS=1` recipe
      below) and confirm **PG 0 / MySQL 0** before flipping any gate — the probe
      count drifts as fixes land; do not trust a stale count.
- [ ] `postgres-tests` job (`ci.yml:542`) gains a second vitest **step**
      inserted right after its core `pnpm vitest run packages/activerecord/` step
      (`ci.yml:580`), in its **own process**: `RUN_ADAPTER_DIRS=1`,
      `AR_DB_FORKS=4`, `PG_TEST_URL`, running `adapters/postgresql` +
      `tasks/postgresql-database-tasks.test.ts` **only**.
- [ ] `mysql-tests` job (`ci.yml:588`) gains the mirror step (`MYSQL_TEST_URL`)
      running `adapters/abstract-mysql-adapter`, `adapters/mysql2`,
      `connection-adapters/mysql`, and explicitly
      `tasks/mysql-database-tasks.test.ts`.
- [ ] **PG step is a hard gate**; **MySQL step is `continue-on-error` for one
      shakedown round**, with a one-line follow-up to flip it to a hard gate once
      a real CI run is observed green (per RFC §Design decision).
- [ ] No double-run: `connection-adapters/postgresql/**` and top-level
      `postgresql-adapter*.test.ts` are **not** in `ADAPTER_SPECIFIC_EXCLUDE`, so
      they already run in the shared suite — exclude them from the new PG step.
- [ ] Reuses the existing service container + `pnpm build` (no new job, no extra
      runner slot); prototype `*-adapter-tests` jobs from PR #2863 (do-not-merge)
      are **not** added — this relocates that step into the existing jobs.
- [ ] `retry: 2` (already configured on the PG/MySQL jobs) preserved on the new
      step.

## Notes

Local verify (raw `docker run` — `docker compose` env interpolation is unreliable
on this host):

```sh
RUN_ADAPTER_DIRS=1 PG_TEST_URL="postgres://postgres:postgres@localhost:<port>/rails_js_test" \
  pnpm vitest run packages/activerecord/src/adapters/postgresql \
  packages/activerecord/src/tasks/postgresql-database-tasks.test.ts
RUN_ADAPTER_DIRS=1 MYSQL_TEST_URL="mysql://root@localhost:<port>/rails_js_test" \
  pnpm vitest run packages/activerecord/src/adapters/abstract-mysql-adapter \
  packages/activerecord/src/adapters/mysql2 \
  packages/activerecord/src/connection-adapters/mysql \
  packages/activerecord/src/tasks/mysql-database-tasks.test.ts
```

Rails parallel: this is the `bin/test` per-adapter model — Rails never interleaves
adapter suites with the shared run; the separate process is the point.
