---
title: "through-singular-association-statement-cache"
status: ready
updated: 2026-07-06
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 22
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`singular-association-statement-cache` (PR #3943) wired the singular-load
statement cache for direct (chain length 1) `loadHasOne` / `loadBelongsTo`
paths, mirroring Rails `Association#find_target` →
`reflection.association_scope_cache` / `sc.execute(binds, c)`.

It deliberately treats **multi-step (through) chains as
`skip_statement_cache?`** (`_skipSingularStatementCache`,
`packages/activerecord/src/associations.ts`) and keeps the per-load `take()`
path for them. Rails does NOT skip through chains — it statement-caches them
too. The reason for the trails skip is a real bug: removing the
`chain.length > 1` guard makes `AssociationScope.getBindValues` (chain order)
and the `AssociationScope.create { params.bind }` scope-build bind order
disagree for through/enum chains, returning the WRONG target (reproduced:
`has-one-through-disable-joins-associations.test.ts` "disable joins through
with enum type" returns a different record id).

This is a tracked-pending-convergence deviation: correctness is preserved
(results match; only the compiled-SQL reuse is missing), but it is a fidelity
gap vs Rails.

## Acceptance criteria

- [ ] `AssociationScope.getBindValues` and the statement-cache scope build
      agree on bind ORDER for multi-step (through) chains, including the
      polymorphic-type and enum-typed bind cases.
- [ ] Remove the `chain.length > 1` clause from `_skipSingularStatementCache`
      so through singular loads use the statement cache, matching Rails.
- [ ] `has-one-through-*` / `nested-through-*` / `polymorphic-sti-through`
      suites stay green on SQLite/PG/MySQL (esp. the enum-through case).
