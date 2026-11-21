---
title: "trailties: move the 120 misplaced tests to their Rails-convention files"
status: in-progress
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: test-structure
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#10522
claim: "2026-11-21T20:39:36Z"
assignee: "retake-the-body-pin-floor-at-the-last-8-0-2-commit"
blocked-by: null
closed-reason: null
---

## Context

`parity:test` reports 120 misplaced tests in 14 groups:

| From                                                                          | To                                                 | Tests |
| ----------------------------------------------------------------------------- | -------------------------------------------------- | ----: |
| `generators/trails/scaffold/scaffold-generator.test.ts`                       | `generators/scaffold-generator.test.ts`            |    27 |
| `generators/trails/scaffold-controller/scaffold-controller-generator.test.ts` | `generators/scaffold-controller-generator.test.ts` |    25 |
| `code-statistics.test.ts`                                                     | `code-statistics-calculator.test.ts`               |    19 |
| `trailtie.test.ts`                                                            | `trailties/trailtie.test.ts`                       |    12 |
| `engine.test.ts` (7) + `application.test.ts` (1)                              | `trailties/engine.test.ts`                         |     8 |
| `generators/trails/db/system/change/change-generator.test.ts`                 | `generators/db-system-change-generator.test.ts`    |     8 |
| `application.test.ts`                                                         | `application/configuration.test.ts`                |     6 |
| `rack/logger.test.ts`                                                         | `rack-logger.test.ts`                              |     5 |
| `commands/db.test.ts`                                                         | `application/rake/multi-dbs.test.ts`               |     4 |
| `generators/trails/benchmark/benchmark-generator.test.ts`                     | `generators/benchmark-generator.test.ts`           |     3 |
| `application/reload-zeitwerk.trails.test.ts`                                  | `application/loading.test.ts`                      |     1 |
| `trailties/active-record.trails.test.ts`                                      | `application/query-logs.test.ts`                   |     1 |
| `generators/active-record/multi-db/multi-db-generator.test.ts`                | `generators/multi-db-generator.test.ts`            |     1 |

Paths are under `packages/trailties/test/`. Moves are `git mv` where a whole file moves.

## Acceptance criteria

- [ ] `parity:test -- --package trailties` reports 0 misplaced.
- [ ] No test body changes beyond imports and describe names.
