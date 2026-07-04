---
title: "Scope full-schema-dump tests off the empty-DB assumption (drop dropAllTables crutch)"
status: ready
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The truncate-based global reset (PR #4504) leaves the ~330 canonical tables
in place between tests (clearing only rows) instead of dropping them. Several
non-transactional tests do a **full-schema** `SchemaDumper.dump(adapter)` on a
pool-leased adapter and were written against the old drop-all reset's _empty_
DB, so they now introspect all ~330 tables. On a cold sidecar adapter this
blows the 5s per-test timeout — the PG `schema-dumper.test.ts` extension cases
(two full dumps each) failed until PR #4504 gave those two plain-reset
`describe` blocks a `beforeEach` `dropAllTables(...)` crutch (with an
`eslint-disable blazetrails/require-table-teardown`, since the carpet-bomb
targets boot-laid canonical tables the file did not create).

That crutch is a deviation worth removing, and the same latent slowdown lives
in sibling files that do full dumps on the pooled `createTestAdapter()` and
currently pass only because the pooled connection's schema cache is warm:
`packages/activerecord/src/comment.test.ts` (lines ~133/149/195),
`date-time-precision.test.ts` (~235/248), `time-precision.test.ts` (~135).
They are one cache-miss away from the same 5s timeout.

## Acceptance criteria

- Remove the `dropAllTables` `beforeEach` crutch from
  `schema-dumper.test.ts` (`SchemaDumperTest` plain block and
  `SchemaDumperDefaultsTest`) and the matching `eslint-disable`.
- Make the cold-sidecar full-dump cases not depend on an empty DB: prefer a
  scoped dump (`dumpTableSchema(source, ...ownTables)`) that only introspects
  the tables the test built, or dump against a dedicated isolated adapter, so
  the ~330 canonical tables never enter the output/timing.
- Audit the sibling full-dump-on-pool callers (`comment`,
  `date-time-precision`, `time-precision`) and apply the same scoping so they
  are robust to a cold schema cache.
- No test-name changes (they match Rails). No new `dropAllTables` callers.
