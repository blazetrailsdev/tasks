---
title: "trailties-test-move-misplaced-tests-remainder"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `trailties-test-move-misplaced-tests`. `pnpm parity:test -- --package trailties`
still reports these misplaced (paths under `packages/trailties/test/`):

| From                                                                                                                                              | To                                   | Tests |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----: |
| `commands/db.test.ts` (describe "db subcommand CLI actions", lines ~500-2095, shared tmpDir/cwd/log setup at :500-545 and module helpers :28-160) | `application/rake/multi-dbs.test.ts` |     4 |
| `application/reload-zeitwerk.trails.test.ts`                                                                                                      | `application/loading.test.ts`        |     1 |
| `trailties/active-record.trails.test.ts`                                                                                                          | `application/loading.test.ts`        |     1 |
| `trailties/active-record.trails.test.ts`                                                                                                          | `application/query-logs.test.ts`     |     1 |

The db tests: "db:migrate respects timestamp ordering across databases", "db:rollback:namespace works",
"db:prepare works on all databases", "db:prepare runs seeds once" (Rails
`vendor/rails/v8.0.2/railties/test/application/rake/multi_dbs_test.rb`). Moving them needs the
describe's setup and the `runTask` / `establishMigrationConnection` helpers to travel too.

## Acceptance criteria

- [ ] `parity:test -- --package trailties` reports 0 misplaced.
- [ ] No test body changes beyond imports and describe names.
