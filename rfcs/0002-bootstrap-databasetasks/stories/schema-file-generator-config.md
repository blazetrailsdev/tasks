---
title: "PR 1 — schema-file generator + test DatabaseConfigurations"
status: ready
updated: 2026-06-04
rfc: "0002-bootstrap-databasetasks"
cluster: bootstrap
deps: []
deps-rfc: []
est-loc: 250
priority: 70
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

New files only, no consumer changes (Phases 0 + 1 of the plan):

- **Phase 0 — schema-file generator.** Walk `TEST_SCHEMA` and emit a module
  whose default export drives `MigrationContext.createTable(...)` calls. Lives
  next to `test-schema.ts`. Generated at runtime, once per worker, to a temp
  path — no checked-in artifact, always in sync with `TEST_SCHEMA`.
- **Phase 1 — test `DatabaseConfigurations`.** A `test-database-config.ts` that
  builds the "test"-env config from `PG_TEST_URL` / `MYSQL_TEST_URL` /
  sqlite-memory (moving the env-sniff out of bootstrap). Wire
  `DatabaseTasks.databaseConfiguration` + `setAdapter`.

See RFC 0002 §Design (three swaps) and §Rollout PR 1.

## Acceptance criteria

- [ ] Generator walks `TEST_SCHEMA` → loadable schema-file module
- [ ] Temp path keyed off `process.env.VITEST_POOL_ID` —
      `os.tmpdir()/trails-schema-<VITEST_POOL_ID>.ts` (in-cwd `tmp/` fallback if
      `node:os` is unwanted)
- [ ] `test-database-config.ts` builds the test config from
      `PG_TEST_URL`/`MYSQL_TEST_URL`/sqlite-memory and wires
      `DatabaseTasks.databaseConfiguration` + `setAdapter`
- [ ] Smoke test for both new modules; no existing consumer touched

## Notes

`node:os` is permitted in test-only infra here. No consumer files change in this
PR, so it is safe to land independently behind PR 0.
