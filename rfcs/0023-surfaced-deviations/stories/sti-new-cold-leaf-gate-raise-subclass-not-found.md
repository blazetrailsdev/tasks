---
title: "STI new() cold-leaf gate should raise SubclassNotFound (column-aware _has_attribute? parity)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `sti-dispatch-raise-subclass-not-found` (PR #3404), which converged
the `new()` STI dispatch to raise `SubclassNotFound` for an out-of-hierarchy or
unknown type on an explicitly STI-enabled receiver (mirroring Rails'
`Inheritance::ClassMethods#new` → `subclass_from_attributes` → `find_sti_class`,
`vendor/rails/.../inheritance.rb:55`).

A residual deviation remains in the dispatch **gate** that runs before
resolution. `subclassFromAttributesForNew`
(`packages/activerecord/src/inheritance.ts:884`) short-circuits with:

```ts
if (!classHasAttribute(modelClass, col) && descendants(modelClass).length === 0) return null;
```

Rails gates the whole `new` STI dispatch on `_has_attribute?(inheritance_column)`
(a column-aware check that reflects DB columns). trails stands in a tracked-STI-
subtree signal (`descendants.length`) for the cases where schema reflection is
not yet warm at construction. The consequence: a **cold leaf** — an `enableSti`
subclass whose `type` column has not reflected yet _and_ which tracks no
descendants of its own — falls into the short-circuit and builds as-is rather
than raising. With an explicit bad type:

```ts
Car.new({ type: "InvalidType" }); // cold-reflected `type`, no descendants
```

trails returns `null` (build `Car`), where Rails — `_has_attribute?("type")`
true via the real reflected column — raises `SubclassNotFound`.

This window is narrow and largely closed in practice by
`production-eager-schema-cache-warm-at-connection` (PR #3373): once the schema
cache is warmed at connection/boot, `classHasAttribute(modelClass, "type")` is
`true` for a genuine `type` column, so the gate no longer short-circuits and the
cold leaf reaches the raising resolver. The residual is the un-warmed-leaf edge
that the `descendants.length` stand-in still swallows.

Related (all merged): `inheritance-column-default-type-and-has-attribute-gate`
(#3302, introduced the gate), `infer-sti-at-instantiate-from-reflected-column`
(#3329, moved the row path onto reflected-column inference),
`production-eager-schema-cache-warm-at-connection` (#3373).

## Acceptance criteria

- [ ] `Car.new({ type: "InvalidType" })` on an `enableSti` leaf subclass with a
      not-yet-reflected `type` column and no tracked descendants raises
      `SubclassNotFound`, matching Rails' `_has_attribute?(inheritance_column)`
      gate — without forcing eager schema reflection on the construction hot path
      for non-STI models.
- [ ] The gate at `inheritance.ts:884` no longer uses `descendants.length === 0`
      as the sole stand-in when the receiver is `stiEnabled`; an STI-enabled leaf
      is gated on the column-aware/structural signal Rails uses, not on whether it
      happens to have descendants.
- [ ] Non-STI models that merely reflect a `type` column keep degrading to
      build-as-is (no raise) — the documented graceful deviation for the row and
      `new` paths is preserved.
- [ ] Existing STI-at-new and STI-at-instantiate tests stay green; api:compare
      and test:compare deltas non-negative.
