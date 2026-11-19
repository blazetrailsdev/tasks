---
title: "Port 'db:seed uses primary database connection' and 'db:setup loads schema and seeds database'"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two Rails seed tests are unported:

- `railties/test/application/rake/multi_dbs_test.rb:1043`
  `db:seed uses primary database connection`: the seeds file prints
  `Book.lease_connection.pool.db_config.database` and `rails("db:seed")`
  must answer `storage/development.sqlite3` with `RAILS_ENV`/`RACK_ENV` unset.
- `railties/test/application/rake/dbs_test.rb:652`
  `db:setup loads schema and seeds database`.

trails' `packages/trailties/test/commands/db.test.ts` maps to
`application/rake/multi-dbs.test.ts` in test:compare and has neither.

## Acceptance criteria

- Both ported with the Rails names verbatim into the convention files for
  `multi_dbs_test.rb` and `dbs_test.rb`, on the canonical tmp-app setup the
  neighbouring ported tests use.
- `pnpm parity:test` counts both as matched.
