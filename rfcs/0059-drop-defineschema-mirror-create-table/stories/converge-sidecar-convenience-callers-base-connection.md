---
title: "converge-sidecar-convenience-callers-base-connection"
status: ready
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
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

RFC 0059 follow-up split from `converge-sidecar-pool-rides-canonical-schema`
(first batch shipped the `relation.trails.test.ts` isBlank/isPresent
conversion). **Rails has no sidecar test pool** — see
`vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30`. This
story converges the _convenience_ `createSidecarTestAdapter()` callers — those
that just need a connection/adapter and assign it to `Model.adapter` — onto
`Base.connection` (the primary, boot-laid canonical-schema pool), exactly as
the Rails counterpart tests do.

Files (all in `packages/activerecord/src/`):

- `attribute-methods/{query,read,write,time-zone-conversion}.test.ts`
- `relation/{arel-ast-convergence,build-arel-helpers,unscope-coverage}.test.ts`

Each currently calls `createSidecarTestAdapter()` (in `beforeEach` or at module
scope) and assigns `.adapter` to a bespoke model. These are pure
SQL-string / attribute-read tests (no DB round-trips). Establish
`Base.connection` via `setupFixtures()` / `setupHandlerSuite()` (see
`relation.trails.test.ts`'s converted `isBlank` describe and the
`Relation#arel build_arel convergence` describe for the pattern) and use
`Base.connection` in place of the sidecar lease. Note `test-setup-dy.ts` calls
`Base.removeConnection()` at boot, so a handler-suite call is required to
re-establish the primary pool.

## Acceptance criteria

- All 7 convenience callers drop `createSidecarTestAdapter` and ride
  `Base.connection` via the handler suite. No test renames. `test:compare`
  delta >= 0. sqlite `:memory:`, template-clone, and PG/MySQL lanes unaffected.
- Read the corresponding Rails test for each suite first (fidelity above all).
