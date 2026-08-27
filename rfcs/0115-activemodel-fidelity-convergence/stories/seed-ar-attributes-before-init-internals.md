---
title: "Seed AR's @attributes before init_internals, as core.rb:474 does"
status: draft
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Core#initialize` (activerecord/lib/active_record/core.rb:471-483)
runs in this order:

```ruby
def initialize(attributes = nil)
  @new_record = true
  @attributes = self.class._default_attributes.deep_dup

  init_internals
  initialize_internals_callback
  ...
```

`@attributes` is seeded BEFORE `init_internals`. trails inverts it:
`packages/activerecord/src/core.ts`'s `initInternals` — the body that stands in
for `Core#initialize`, since a TS constructor cannot be chained by `include()` —
sets `_newRecord`, calls `super_()` down the prepend chain, and only seeds
`this._attributes` at the very END, after `klass.defineAttributeMethods()`.

The reason is a trails-only coupling, spelled at the call site: trails loads the
schema lazily inside `defineAttributeMethods()`, and loading it drops the
memoized `_defaultAttributes` that an earlier read would have captured. Seeding
first therefore hands the record a stale/empty attribute set — this is what
`CustomPropertiesTest > attributes added after subclasses load are inherited`
(packages/activerecord/src/attributes.test.ts) catches.

This ordering predates PR #7134; that PR only relocated it out of `Model`'s
constructor (which already did `initInternals()` → `_resurrectAttributeMethods`
→ `_attributes =`) into AR's own `init_internals` stand-in. Filing it now that
it is visible in one body rather than split across two files.

## Acceptance criteria

- `_attributes` is seeded where `core.rb:474` seeds it — before the
  `init_internals` chain runs — with no trailing re-seed.
- `defineAttributeMethods()` / the lazy schema load no longer invalidates a
  `_defaultAttributes` value read earlier in the same construction, or the read
  is ordered so it cannot observe the stale one.
- `packages/activerecord/src/attributes.test.ts`'s
  `attributes added after subclasses load are inherited` and
  `define_attribute registers a type object directly` stay green, as do the
  multiparameter and nested-attributes suites.
- The comment explaining the inversion is deleted along with the inversion.
