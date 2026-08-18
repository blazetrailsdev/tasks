---
title: "Collapse the new() STI dispatch gate onto Rails' _has_attribute? alone (drop the descendants-count stand-in)"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6713
claim: "2026-08-18T19:22:39Z"
assignee: "converge-includes-preload-colon-sweep-associations-eager-test"
blocked-by: null
closed-reason: null
---

## Context

Residual left by [[sti-new-cold-leaf-gate-raise-subclass-not-found]] (PR #6705),
which converged the STI-enabled arm of the `new()` dispatch gate but left the
rest of the gate diverging from Rails.

Rails gates the ENTIRE `new` STI dispatch on one thing —
`_has_attribute?(inheritance_column)`, i.e. `attribute_types.key?(name)`
(`vendor/rails/activerecord/lib/active_record/inheritance.rb:53-92`,
`ClassMethods#new` → `subclass_from_attributes` → `find_sti_class`). One
column-aware check, no second or third signal.

`subclassFromAttributesForNew` (`packages/activerecord/src/inheritance.ts:1154`)
now reads:

```ts
if (
  !classHasAttribute(modelClass, col) &&
  !stiEnabled(modelClass) &&
  descendants(modelClass).length === 0
)
  return null;
```

PR #6705 added the `!stiEnabled(modelClass)` arm, which fixed the cold-leaf case.
Two divergences from Rails survive:

1. **`descendants(modelClass).length === 0` is a trails invention.** Rails has no
   descendant-count input to this gate at all. It stands in for schema
   reflection not being warm at construction — a canonical STI base like
   `Company` declares no `attribute("type")` and its `type` column only reflects
   once the schema loads.
2. **A non-STI model that merely reflects a `type` column degrades to
   build-as-is** instead of raising `SubclassNotFound`. Rails raises, because
   Zeitwerk can tell an unloaded-but-valid subclass from a genuinely bad type;
   trails has no autoloader, so raising here would break unrelated construction.
   This is the documented graceful deviation the row path
   (`findStiClassForRow`) also takes.

Both are currently justified at the call site in `subclassFromAttributesForNew`'s
JSDoc. That is debt, not permission (CLAUDE.md).

## Converged shape

Collapse the gate to Rails' single `_has_attribute?` check. That requires
`classHasAttribute(modelClass, inheritanceColumn)` to be reliable at
construction time for a model with a real `type` column, which is what the
`descendants` arm exists to paper over. Two candidate routes, in order:

- Make the reflection the gate reads warm enough to trust — note
  `production-eager-schema-cache-warm-at-connection` (#3373) already closes most
  of this window, so the residual may be narrower than it looks. Establish
  exactly which construction paths still see a cold `classHasAttribute` before
  designing anything.
- Failing that, resolve divergence 2 by giving trails a stand-in for Zeitwerk's
  "is this a loadable constant?" question, so the non-STI arm can raise as Rails
  does rather than degrading.

If divergence 2 genuinely cannot converge without an autoloader, `pnpm tasks
block` it with that as the blocker — but divergence 1 (the `descendants` arm)
should converge regardless, since it is a trails-only input to a Rails gate.

## Acceptance criteria

- [ ] The gate no longer consults `descendants(modelClass).length`; it reads the
      column-aware signal Rails reads.
- [ ] Cold-schema construction paths do not regress — in particular the
      `VerySpecialClient` cold-leaf case pinned by
      `inheritance-sti-new-gate.trails.test.ts` stays green, and that test's
      cold-schema precondition assertion still holds.
- [ ] Either non-STI models with a reflected `type` column raise
      `SubclassNotFound` as Rails does, or the story is blocked with the
      autoloader blocker recorded at a trails/Rails `file:line`.
- [ ] The call-site JSDoc deviation notes in `subclassFromAttributesForNew`
      shrink to match whatever actually remains.
- [ ] Existing STI-at-new and STI-at-instantiate tests stay green; parity:api and
      parity:test deltas non-negative.
