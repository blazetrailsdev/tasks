---
title: "trailties-relocate-remaining-misplaced-tests"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
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
closed-reason: "FALSIFIED: subsumed by trailties-move-tests-converging-assertions"
---

## Context

Five tests stayed misplaced after the bulk move for
`trailties-relocate-misplaced-test-files`. `db:migrate respects timestamp ordering
across databases`, `db:rollback:namespace works`, `db:prepare works on all databases`
and `db:prepare runs seeds once` are in `packages/trailties/src/commands/db.test.ts`
and belong in `application/rake/multi-dbs.test.ts`
(`vendor/rails/v8.0.2/railties/test/application/rake/multi_dbs_test.rb`).
`does not modify the query execution path by default` is in
`packages/trailties/src/trailties/active-record.trails.test.ts`, inside the
`boot` closure of its `active_record.query_log_tags_config` describe, and belongs
in `application/query-logs.test.ts`
(`vendor/rails/v8.0.2/railties/test/application/query_logs_test.rb`).

## Acceptance criteria

- The five tests move, with names unchanged, taking the setup they need.
- `pnpm parity:test --package trailties` reports 0 misplaced.
