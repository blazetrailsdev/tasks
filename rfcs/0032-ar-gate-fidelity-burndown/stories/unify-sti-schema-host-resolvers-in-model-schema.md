---
title: "Unify the two divergent STI schema-host resolvers in model-schema.ts"
status: draft
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After #5170 merged (on top of #5168), `packages/activerecord/src/model-schema.ts`
contains TWO independent resolvers for "which class owns STI schema work", and
they disagree on the same input:

- `stiSchemaHost` (model-schema.ts:51, added by #5170) — walks from the receiver
  up the prototype chain to the TOPMOST ancestor still sharing the receiver's
  `tableName`, stopping at an abstract class or a table mismatch. Used by the
  load/memo path: `columnsHash`, `cachedColumnsHash`, `attributesBuilder`,
  `columns`, `syncStiSubclassAttributeDefinitions`, `loadSchema`,
  `loadSchemaFromAdapter`, `reconcileVirtualAttributes`,
  `loadSchemaFromCacheSync`.
- `sharesStiBaseTable` (model-schema.ts:901, added by #5168) — a boolean
  `getStiBase(klass).tableName === klass.tableName`, i.e. compares against the
  TOPMOST `_inheritanceColumn` ancestor. Used by the invalidation path:
  `reloadSchemaFromCache` (:924) and its subclass recursion (:943, :893).

Divergent case — `Shape (STI, "shapes") → Circle → Ticket (own "tickets") →
VipTicket (no own table_name, inherits "tickets")`:

- Load path: `stiSchemaHost(VipTicket)` → `Ticket`. VipTicket shares Ticket's
  `_schemaLoaded` / `_columnsHash` / `_attributesBuilder` via the prototype
  chain, which is the intent.
- Invalidation path: `sharesStiBaseTable(VipTicket)` compares `Shape.tableName`
  ("shapes") vs "tickets" → false, so `reloadSchemaFromCache` treats VipTicket
  as its own full-reload target rather than clearing overlay-local caches and
  redirecting to Ticket.

Effect today is over-invalidation, not stale data (the full reload is a superset
of the overlay clear), so this is a consistency/cost defect rather than a
correctness bug — the same benign-impact reasoning as
`get-sti-base-returns-topmost-not-nearest-sti-ancestor`. It is filed separately
because that story asks whether `getStiBase` itself should become nearest-wins;
this one holds regardless of that decision: one file should not carry two
resolvers with different answers.

Note for whoever picks this up: the STI schema-host redirect has no Rails
counterpart at all (Rails' `load_schema!`, model_schema.rb:587-597, always uses
`self.table_name` and stores into the class's own `@columns_hash`; ivars are not
inherited). Removing it wholesale is tracked by
`sti-schema-host-redirect-is-a-trails-invention` — if that lands first, this
story evaporates.

## Acceptance criteria

- One resolver for the STI schema host in model-schema.ts. Preferred direction:
  `reloadSchemaFromCache` and its recursion consult `stiSchemaHost` (compare
  `stiSchemaHost(klass) !== klass`) and `sharesStiBaseTable` is deleted, rather
  than teaching `sharesStiBaseTable` the walk a second time.
- Regression test on the 4-level fixture asserting the load path and the
  invalidation path agree on the host for `VipTicket` — reuse the hierarchy in
  `model-schema-load-own-table-descendant.trails.test.ts` and the assertions in
  `model-schema-reload-recursion.trails.test.ts`.
- Existing STI suites stay green, including #5168's and #5170's own-table
  regression tests.
