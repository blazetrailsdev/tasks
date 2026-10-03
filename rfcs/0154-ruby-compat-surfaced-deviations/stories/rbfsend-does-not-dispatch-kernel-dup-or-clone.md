---
title: "ruby-compat: rbFSend / rbObjRespondTo do not reach Kernel#dup / Kernel#clone"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Found while shipping trails#8434 (`Attribute#initialize_dup`, `activemodel/lib/active_model/attribute.rb:155-159`, `@value = @value.dup`).

In Ruby every object answers `dup` through `Kernel#dup` (`vendor/ruby/v3.3.11/object.c:591` `rb_obj_dup`), so `value.send(:dup)` always dispatches. ruby-compat's `rbFSend(value, "dup")` (`packages/ruby-compat/src/object.ts`, `sendInternal`) only walks the prototype chain for a property named `dup`, and raises `NoMethodError: undefined method 'dup' for an instance of Array` (likewise for `Map`, `Set`, a plain object, `Time`, a JS `Date` and a plain class instance). `rbObjRespondTo(value, "dup")` answers false for the same values.

So a Rails body that sends `dup` has to be ported as a direct `rbObjDup(value)` call, and a dynamic `send(name)` whose name happens to be `dup` (or `clone`) fails where Ruby succeeds.

## Acceptance criteria

- [ ] `rbFSend(obj, "dup")` and `rbFSend(obj, "clone")` fall back to `rbObjDup` / `rbObjClone` when the receiver defines no member of that name, as `Kernel#dup` / `Kernel#clone` do.
- [ ] `rbObjRespondTo(obj, "dup")` / `"clone"` answer true for those receivers.
- [ ] A test covering an Array, a Map, a Set, a plain object, a `Time` and a class instance.
