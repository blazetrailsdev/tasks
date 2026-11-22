---
title: "trailties-isolation-tests-run-on-postgresql"
status: done
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10522
claim: "2026-11-21T23:50:05Z"
assignee: "trailties-isolation-tests-run-on-postgresql"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/rake/multi_dbs_test.rb:1021-1041` ("db:prepare runs seeds once")
calls `use_postgresql(multi_db: true)` (`:1024`). The port in
`packages/trailties/test/application/rake/multi-dbs.test.ts` (trails#10522) runs it on the isolation harness's SQLite
multi-db config, because the trailties test lane in `.github/workflows/ci.yml` has no Postgres service (only the
ActiveRecord and Action Cable PostgreSQL jobs do). `Generation#usePostgresql`
(`packages/trailties/test/support/isolation/abstract-unit.ts:477`) exists but has no caller.
`multi_dbs_test.rb:1001` ("db:prepare setups missing database without clearing existing one") needs the same service.

## Acceptance criteria

- [ ] The trailties CI lane provides a Postgres service the isolation harness can reach.
- [ ] "db:prepare runs seeds once" calls `t.usePostgresql({ multiDb: true })` as `multi_dbs_test.rb:1024` does.
