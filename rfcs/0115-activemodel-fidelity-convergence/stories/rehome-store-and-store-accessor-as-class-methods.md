---
title: "Rehome store / store_accessor as class methods instead of modelClass-first free functions"
status: ready
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Store::ClassMethods#store`
(`vendor/rails/activerecord/lib/active_record/store.rb:100-115`) and
`#store_accessor` (`:117-142`) are class methods: a model body writes
`store :settings, accessors: [...]`, and the body reads `self`.

trails spells both as free functions taking the class as the first parameter —
`store(modelClass, storeAttribute, options)` and
`storeAccessor(modelClass, storeAttribute, options)` in
`packages/activerecord/src/store.ts` — so every call site carries an argument
Rails does not have, and `parity:api:calls:args` sees a different argument list
at each one.

Surfaced in `rehome-serialize-onto-attribute-methods-serialization` (PR #7176),
which converged `store`'s own inner call: it now reads
`modelClass.serialize(storeAttribute, { coder: ... })`, matching store.rb:108
argument-for-argument, which is what left `store`'s and `storeAccessor`'s own
signatures as the remaining deviation in the file. That PR also retired the
`registerSerializeFn` injection shim (and its `@noRailsEquivalent PERMANENT`
receipt) the old free-function shape required.

## Converged shape

`store` and `storeAccessor` become `this`-typed class methods on a
`ClassMethods` object `extend()`ed onto `Base` at the store.rb seat (CLAUDE.md,
"Module mixins"), so a model body reads `Klass.store("settings", { ... })`.
Call sites — tests, `test-helpers/models/`, the index barrel — move to the
method spelling.

`localStoredAttributes` / `storedAttributes` already sit on `Base`; this closes
the gap between them and the two macros that populate them.

## Acceptance criteria

- [ ] `store` / `storeAccessor` are class methods reaching `Base` through
      `extend()` at the store.rb seat, not free functions taking `modelClass`.
- [ ] Every call site uses the method spelling; the free-function export is
      gone from `index.ts`.
- [ ] `pnpm parity:api:calls:args` delta non-negative; activerecord suite green
      on all three lanes.
