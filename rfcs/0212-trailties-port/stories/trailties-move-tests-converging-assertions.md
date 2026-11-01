---
title: "trailties-move-tests-converging-assertions"
status: draft
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
closed-reason: null
---

## Context

trails#9565 tried moving trailties' 144 misplaced tests in bulk with bodies unchanged.
That took parity:test from 305 to 422 matched, but the assertion ratchet went red:
count 5 to 76, kind 11 to 93, value 0 to 7. Every moved file exposes differences from
its Rails file, so a body-unchanged bulk move cannot pass. Moves: `generators/rails/*/*-generator.test.ts`
to `generators/*-generator.test.ts` (change-generator to `db-system-change-generator.test.ts`),
`rack/logger` to `rack-logger`, `rack/silence-request` to `rack-silence-request`,
`health-controller` to `rails-health-controller`, `info-controller` to
`rails-info-controller`, `trailtie` to `trailties/trailtie`; the calculator describe of
`code-statistics.test.ts` to `code-statistics-calculator.test.ts`; seven tests of
`engine.test.ts` and one of `application.test.ts` to `trailties/engine.test.ts`; six of
`application.test.ts` to `application/configuration.test.ts`; one of
`generators/app-generator.test.ts` to `generators/api-app-generator.test.ts`; four of
`commands/db.test.ts` to `application/rake/multi-dbs.test.ts`; one of
`trailties/active-record.trails.test.ts` to `application/query-logs.test.ts`.

## Acceptance criteria

- Tests move a file or small group per PR, and each PR converges the moved tests'
  assertions on the Rails test so the assertion ratchet stays green. Names do not change.
- `pnpm parity:test --package trailties` reports 0 misplaced.
