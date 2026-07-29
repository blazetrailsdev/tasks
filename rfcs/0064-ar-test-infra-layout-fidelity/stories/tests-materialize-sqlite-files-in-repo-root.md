---
title: "AR suites write db/primary.sqlite3 into the working tree; Rails uses the path as config only"
status: draft
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Several AR test suites use `db/primary.sqlite3` (and similar relative paths) as
a database config value and then actually connect to it, so a real SQLite file
is created in the repo working tree during a test run —
`connection-handling.test.ts` (`establish_connection accepts a DatabaseConfig`,
`loadConfigFile resolves config/database.* against Trails.root`) and
`establish-connection.test.ts`.

Rails uses those relative paths as config values only and restores `:arunit`
afterwards (`vendor/rails/activerecord/test/cases/connection_adapters/connection_handler_test.rb:141,157`);
no database file is checked in or produced at the repo root.

PR #5415 accidentally committed the generated `db/primary.sqlite3` (a `git add
-A` swept it in); the file was removed and `/db/` added to `.gitignore` in the
same PR. The ignore rule stops it being committed again but does not stop the
test run from writing into the working tree.

**Scope correction (PR #5600 / `reconcile-repo-root-sqlite-audit-with-fixture-databases`):**
the sqlite3 lane's configured `arunit` / `arunit2` databases are now
`db/fixture_database.sqlite3` and `db/fixture_database_2.sqlite3`
(`support/config.ts`), the trails spelling of Rails'
`<%= FIXTURES_ROOT %>/fixture_database.sqlite3`
(`vendor/rails/activerecord/test/config.example.yml:83-91`). They are a
deliberate, configured writer under `db/`, not an accident — reached only when
the worker bootstrap publishes no `AR_TEST_WORKER_DB` (a setup-free single-file
run), so a normal `pnpm vitest run` does not produce them. They are exempt from
this audit, and the `/db/` .gitignore entry stays: Rails gitignores its own pair
in place (`vendor/rails/activerecord/.gitignore:5`,
`/test/fixtures/*.sqlite*`), so the ignore is the same arrangement, not a
leftover.

## Acceptance criteria

- Audit which suites materialize a SQLite file under the repo root, and point
  them at the worker's tmp path (or assert the config is never connected)
  so a test run leaves the working tree clean. Exempt the configured sqlite3
  fixture databases (`SQLITE_FIXTURE_DATABASE` / `SQLITE_FIXTURE_DATABASE_2` in
  `support/config.ts`) — they are configuration, and the target is
  `db/primary.sqlite3` and friends.
- `git status` is clean after running the activerecord suite locally.
- Keep the relative-path _config values_ where Rails uses them — the point is
  not to create the file, not to rename the config.
- Leave the `/db/` .gitignore entry in place: it is load-bearing for the
  configured fixture databases.
