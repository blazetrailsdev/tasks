---
title: "Wire locking/optimistic _createRecord into the create path (thread attribute_names)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: 3949
claim: "2026-06-23T01:39:16Z"
assignee: "thread-attribute-names-through-create-record"
blocked-by: null
---

## Context

Surfaced in PR #3788 (partial-inserts-optimistic-locking-initial-value). Rails
places the locking-column INSERT union in `Locking::Optimistic#_create_record`
(`attribute_names |= [locking_column]`, optimistic.rb:79-84), threading the
modified `attribute_names` down through `super` → `attributes_for_create`.

trails already has the faithful mirrors in
`packages/activerecord/src/locking/optimistic.ts`: `_createRecord` (line ~180),
`_touchRow` (~196), `_updateRow` (~213) — but they are **NOT wired into the
persistence path**. `base.ts` only includes `lockingColumn`, `lockingEnabled`,
`hookAttributeType`, `updateCounters`, `initializeDup` from `LockingOptimistic`
(base.ts:4168 + getters). The create path is callbacks.ts `_createRecord` →
base.ts `_performInsert`, which recomputes the column list from scratch via
`Object.keys(attrs)` → `attributesForCreate` and never receives the unioned
`attributeNames`.

As a result PR #3788 had to place the locking-column union directly inside the
generic `attributesForCreate` (`attribute-methods.ts`), a layering deviation
from Rails (which keeps it in `locking/optimistic.rb`). The `optimistic.ts`
`_createRecord`/`_touchRow`/`_updateRow` functions are effectively dead code.

## Acceptance criteria

- [x] `_performInsert`/create path accepts and honors a threaded
      `attributeNames` so the Rails `_create_record` → `attributes_for_create`
      ordering is preserved.
- [x] `LockingOptimistic._createRecord` is wired into the persistence path and
      carries the locking-column union, so it was removed from the generic
      `attributesForCreate`. (`_touchRow`/`_updateRow` deferred to story
      wire-locking-touch-update-row-into-persistence-path — out of create-path scope.)
- [x] `locking.test.ts` + `persistence.test.ts` stay green; no api:compare /
      test:compare regression.
