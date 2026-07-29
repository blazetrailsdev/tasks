---
title: "Worker-clone arunit2 is still derived by the _arunit2 suffix helper"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5610
claim: "2026-07-29T22:24:55Z"
assignee: "converge-sqlite-worker-clone-arunit2-sibling"
blocked-by: null
closed-reason: null
---

## Context

PR #5600 converged the configured sqlite path: `support/connection.ts`'s
`sqliteEntries` now spells `arunit` and `arunit2` out as
`SQLITE_FIXTURE_DATABASE` / `SQLITE_FIXTURE_DATABASE_2`
(`db/fixture_database.sqlite3`, `db/fixture_database_2.sqlite3`), matching
`vendor/rails/activerecord/test/config.example.yml:83-91`, where both sqlite
entries name their own file and `expand_config` fills `database` in only when
the entry carries none (`test/support/config.rb:30-36`).

The worker-clone path still diverges. When `AR_TEST_WORKER_DB` is set (the
per-worker template clone stamped by `test-setup-worker-db.ts`, see
`support/sqlite-template.ts`), `sqliteEntries` leaves `arunit2` as
`database: undefined` so `expandConfig` derives it through
`arunitDatabaseNames()`'s `_arunit2` suffix — yielding
`<tmpdir>/ar-test-worker-<token>-<slot>.sqlite_arunit2`, a name Rails never
produces and one whose extension is mangled.

The suffix helper exists because trails' primary database name is worker-scoped
where Rails' is a constant, so this cannot be fixed by deleting the helper; the
clone path needs its own explicitly-named sibling, the way the configured path
now has one.

## Acceptance criteria

- The worker-clone `arunit2` entry names an explicit sibling file (e.g. the
  clone path with `_2` before the `.sqlite` extension), not a suffix appended
  after the extension by the generic `_arunit2` helper.
- `expandConfig` no longer derives a sqlite `arunit2` database on any path;
  the sqlite builder always supplies both, as `config.example.yml` does.
- The sweep in `sqlite-template.ts` still collects the sibling.
