---
title: "activerecord: find, find_with_ids, find_nth_with_limit, find_some_ordered and authenticate_by keep invented arms"
status: claimed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

Left from story `activerecord-arms-on-top-level-functions-the-skeleton-writer-newly-compares`. Five
top-level ports still take arms Rails does not, each receipted `CONVERGEABLE` against this story:

- `find` (`packages/activerecord/src/relation/finder-methods.ts`): Rails is `return super if block_given?`
  then `find_with_ids(*args)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:98-101`).
  The port inlines `Enumerable#find` in place of the `super`: an arity raise, the loop, and an `ifnone`
  `NoMethodError`.
- `findWithIds`: raises `NoMethodError` by hand where Ruby's `ids.first.first` raises it
  (`finder_methods.rb:494-496`).
- `findNthWithLimit`: raises `NoMethodError` by hand for a String `limit_value`, where Ruby's
  `limit_value - index` raises it (`finder_methods.rb:608-610`).
- `findSomeOrdered`: stringifies a composite id before `inOrderOf`, because
  `packages/activesupport/src/enumerable-utils.ts`'s `inOrderOf` groups by JS identity where
  `Enumerable#in_order_of` uses `Hash` equality (`finder_methods.rb:567-582`).
- `authenticateBy` (`packages/activerecord/src/secure-password.ts`): duck-types `toH` where Rails calls
  `attributes.to_h` (`vendor/rails/v8.0.2/activerecord/lib/active_record/secure_password.rb:41`).

## Acceptance criteria

- [ ] `find` dispatches its block arm to a ported `Enumerable#find`; the two hand-raised
      `NoMethodError`s are raised by the operation Ruby raises them from, or ruled permanent.
- [ ] `inOrderOf` compares keys with `rbEqual` / `rbHash`, and `findSomeOrdered` drops the `String` arm.
- [ ] `authenticateBy` calls one `to_h`.
- [ ] Each `@inventedArm ... CONVERGEABLE` receipt naming this story is deleted.
