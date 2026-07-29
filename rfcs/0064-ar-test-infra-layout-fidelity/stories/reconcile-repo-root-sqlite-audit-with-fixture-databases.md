---
title: "Repo-root sqlite audit predates the configured fixture databases"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5603
claim: "2026-07-29T21:24:00Z"
assignee: "reconcile-repo-root-sqlite-audit-with-fixture-databases"
blocked-by: null
closed-reason: null
---

## Context

`tests-materialize-sqlite-files-in-repo-root` (RFC 0064, draft) is premised on
nothing intentionally writing a sqlite file under the repo root, and its last
acceptance criterion is "reassess whether the `/db/` .gitignore entry is still
needed once no suite writes there".

PR #5600 changed that premise. The sqlite3 lane's configured `arunit` /
`arunit2` databases are now `db/fixture_database.sqlite3` and
`db/fixture_database_2.sqlite3` (`support/config.ts`), the trails spelling of
Rails' `<%= FIXTURES_ROOT %>/fixture_database.sqlite3`
(`vendor/rails/activerecord/test/config.example.yml:83-91`). Rails keeps its
pair inside the checked-in `test/fixtures` directory; trails has no
`FIXTURES_ROOT`, so the name is repo-relative and `support/connection.ts`
creates `db/` on demand. That path is reached only when the worker bootstrap
publishes no `AR_TEST_WORKER_DB` (a setup-free single-file run), so a normal
`pnpm vitest run` does not write it — but it is now a deliberate, configured
writer under `db/`, not an accident to be eliminated.

## Acceptance criteria

- Update `tests-materialize-sqlite-files-in-repo-root` so its audit exempts the
  configured fixture databases and drops the "remove the `/db/` ignore" step
  (the ignore entry is load-bearing for them).
- Decide where the fixture pair should live if `db/` is not the right analogue
  of `FIXTURES_ROOT` — and if it moves, move both names together in
  `support/config.ts`.
- `git status` stays clean after a setup-free single-file run.
