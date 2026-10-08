---
title: "activemodel-clone-value-calls-rb-obj-clone"
status: ready
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

`ForcedMutationTracker#clone_value`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_mutation_tracker.rb:144-149`)
is `value.duplicable? ? value.clone : value`, rescuing `TypeError, NoMethodError`.
`packages/activemodel/src/attribute-mutation-tracker.ts#cloneValue` now has the
Rails control flow (`try` / the `isDuplicable` ternary / the rescue), but its
clone arm still calls the file-local `dupValue`, a deep copy of plain objects
and arrays with special cases for `Date` and `Temporal`, where Rails' `clone` is
shallow. `packages/activemodel/src/attribute.ts` carries a second copy of
`dupValue`.

It cannot be spelled `rbObjClone(value)` today: `rbObjClone`
(`packages/ruby-compat/src/include.ts`) allocates with `Object.create(proto)`
(`rbObjAlloc`) and copies own descriptors, which yields a broken object for any
built-in holding internal slots — a cloned `Date` throws on `getTime()`, and the
same holds for `Map`, `Set`, `RegExp`, typed arrays (binary attribute values)
and `Temporal.*`. Ruby's `rb_obj_clone` (`vendor/ruby/v3.3.11/object.c`) copies
those through each class's `initialize_copy`.

## Acceptance criteria

- [ ] `rbObjClone` / `rbObjDup` return a working copy of `Date`, `Map`, `Set`,
      `RegExp`, typed arrays and `Temporal` values.
- [ ] `cloneValue` calls `rbObjClone(value)`, and both `dupValue` helpers are
      deleted (or reduced to whatever `Attribute#initialize_dup` needs, ported
      at its Rails call).
- [ ] `forceChange` on a `Date`, array and plain-object attribute is covered by a
      test that fails on the current `dupValue` deep copy where Rails is shallow.

## Owner decision (2026-10-08 blocked-story triage)

ruby-compat's `Hash` and `@blazetrails/date`'s `Date` implement `initializeCopy` (Ruby's `initialize_copy`), which runs inside the class and can copy its own `#private` fields; `rbObjAlloc` builds the blank through the constructor. No class moves off `#private` fields.
