---
title: "getStiBase returns topmost not nearest STI ancestor, misclassifying nested STI hierarchies"
status: in-progress
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: 5212
claim: "2026-07-24T03:53:23Z"
assignee: "get-sti-base-returns-topmost-not-nearest-sti-ancestor"
blocked-by: null
closed-reason: null
---

## Context

Latent gap found while implementing `sharesStiBaseTable` in PR #5168
(packages/activerecord/src/model-schema.ts).

`getStiBase` (packages/activerecord/src/inheritance.ts:519-529) walks the whole
prototype chain and keeps reassigning `base` to **every** ancestor whose
`_inheritanceColumn` reads truthy, so it returns the **topmost** STI ancestor,
not the nearest one:

```ts
while (current && current !== Function.prototype) {
  if ((current as any)._inheritanceColumn) base = current;
  current = Object.getPrototypeOf(current) as typeof Base;
}
```

`sharesStiBaseTable(klass)` (added by #5168) is defined as
`getStiBase(klass).tableName === klass.tableName`. That is correct for the
single-level hierarchies it was written for, but misclassifies a **nested** STI
hierarchy: an own-table class `Ticket` (own `table_name = "tickets"`, nested
under STI base `Shape`) that itself re-enables STI via its own
`_inheritanceColumn`, with a genuine shared-table STI child `Urgent < Ticket`.

For `Urgent`, `getStiBase(Urgent)` returns `Shape` (topmost), not `Ticket`
(nearest). So `sharesStiBaseTable(Urgent)` compares `Shape.tableName`
("shapes") against `Urgent.tableName` ("tickets") → `false`, and
`reloadSchemaFromCache` routes `Urgent` down the full-reload arm even though it
IS a genuine shared-table STI overlay of `Ticket` and should have taken the
`clearStiSubclassLocalCaches` arm.

Impact is currently benign — the full reload is a superset of the overlay clear,
so the effect is over-invalidation (extra `_schemaRevision` bumps and a defs
scrub on a class that shares its parent's Map), not stale data. No known
production model uses a nested STI hierarchy under an own-table descendant, and
`getStiBase`'s topmost-wins semantics are themselves questionable for this case,
which is why #5168 deliberately scoped it out.

Related (same cluster):
`load-schema-own-table-descendant-under-sti-loads-wrong-table`,
`attributes-own-table-descendant-under-sti-routes-to-base`.

## Acceptance criteria

- Decide whether `getStiBase` should return the **nearest** STI ancestor rather
  than the topmost (check Rails' `base_class` semantics in
  vendor/rails/activerecord/lib/active_record/inheritance.rb first — Rails'
  `base_class` walks up to the class whose superclass is abstract or `Base`,
  which is nearest-wins, not topmost-wins).
- If `getStiBase` changes, audit its other call sites in model-schema.ts
  (`loadSchema`, `loadSchemaFromCacheSync`, `columnsHash`, the attribute-overlay
  paths) — changing base resolution there is a much wider blast radius than
  `sharesStiBaseTable` alone.
- Regression test covering `Shape (STI) → Ticket (own table, STI re-enabled) →
Urgent (shares tickets)`: `Urgent` must take the overlay-clear arm, not the
  full-reload arm.
- Existing STI suites and #5168's own-table regression tests stay green.
