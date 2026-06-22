---
title: "R3: remove sibling-borrow + recovery test once cache is always-warm"
status: ready
updated: 2026-06-16
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps:
  - r2-drop-synthesize-converge-adhoc-model-tests
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `0031-schema-cache-always-warm-convergence` phase R3 (deps: R2). Once reads
are always warm (R1) and synthesize is gone for table-backed models (R2),
`borrowSameTableColumns` in `packages/activerecord/src/model-schema.ts` has
nothing to recover — a fresh same-table model reads the live, persistent cache
entry directly via `loadSchemaFromCacheSync` and applies its own `ignoredColumns`
at read time, matching Rails' shared-cache semantics. This is the original
`columnshash-sync-schema-cache-reload-vs-sibling-borrow` story's goal, now
unblocked.

## Scope

- Delete `borrowSameTableColumns` and its call site in `loadSchema`.
- Delete / repoint `model-schema-columnshash-recovery.test.ts` (its manual
  `schemaCache.clear()` reproducer no longer reflects a reachable state once the
  harness keeps the cache warm; replace with a warm-cache same-table read test).
- Verify `relation/select.test.ts` `reselect with default scope select` and the
  same-table recovery scenario pass in full-file order.

## Acceptance criteria

- [ ] `borrowSameTableColumns` removed; no remaining references.
- [ ] A fresh same-table model's sync `columnsHash()` returns the table's real
      columns sourced from the persistent warm cache (no sibling borrow), with a
      same-table sibling that declares `ignoredColumns` (the case borrow could
      not handle) covered by a test.
- [ ] `relation/select.test.ts` reselect test green; full AR suite green on
      SQLite canonical; PG/MySQL per gate.

## Hard rules

- NEVER rename existing test names; No `node:*` imports; NO `process.*`; async fs only.
- Conventional commits; draft PR; /link after open.
