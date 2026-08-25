---
title: "Widen the arm-probe guard and lint rule past createTable to every DDL emitter a cover can stub"
status: done
updated: 2026-07-31
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5702
claim: "2026-07-31T02:09:04Z"
assignee: "widen-arm-probe-guard-beyond-createtable"
blocked-by: null
closed-reason: null
---

## Context

Two mechanisms now stop an arm-content cover from routing through `loadSchema`,
and both key on `createTable` alone:

- `eslint/no-load-schema-with-stubbed-ddl.mjs` — `STUBBED_DDL_METHODS` is the
  single-element set `{"createTable"}` (PR #5693).
- `assertNotArmProbe` in
  `packages/activerecord/src/support/load-schema-helper.ts` — the runtime guard
  compares only `createTable` against its prototype method (PR #5696).

A cover that instead intercepts `execute`, `dropTable`, or `schemaCreation` lays
nothing on the database either, and would sail past both. The failure mode is
the expensive one this pair exists to prevent: `relation "..." does not exist`
on the PG lane only, invisible to a local unit run.

## Acceptance criteria

- Establish which adapter methods an arm-content cover can intercept such that
  `loadCanonicalSchema` stops really laying tables (`runTable` goes through
  `SchemaStatements`, so the reachable set may be wider than `createTable`).
- Widen `STUBBED_DDL_METHODS` and the runtime guard to that set, keeping them
  derived from one shared list rather than two hand-maintained ones.
- A cover for each newly-guarded method, in the shape of
  `support/load-schema-helper-arm-guard.trails.test.ts`; each must fail on the
  pre-widening baseline.
- The transparent-proxy direction still passes: no legitimate wrapper is broken.
