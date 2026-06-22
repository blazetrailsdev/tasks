---
title: "Un-skip named-scoping scope-definition guards (callable + reserved/relation names)"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 150
priority: 30
pr: 3878
claim: "2026-06-22T12:43:58Z"
assignee: "unskip-named-scoping-scope-definition-guards"
blocked-by: null
---

## Context

`scoping/named-scoping.test.ts` (converted to canonical in PR #3584) skips four
Rails cases that require scope-definition guards trails does not implement:

- `scopes body is a callable` — Rails `ActiveRecord::Scoping::Named::ClassMethods#scope`
  raises `ArgumentError, "The scope body needs to be callable."` when the body
  is not callable. `packages/activerecord/src/scoping/named.ts:17` performs no
  check.
- `eager default scope relations are remove` — Rails
  `Scoping::Default::ClassMethods#default_scope` raises `ArgumentError` when
  handed a `Relation` instead of a callable. trails `defaultScope`
  (`scoping/default.ts:123`) does not.
- `scopes name is relation method` — Rails raises `ArgumentError`
  (`You tried to define a scope named "<name>" on the model ...`) for names that
  collide with `Relation` instance methods (`records`, `to_ary`, `to_sql`,
  `explain`).
- `reserved scope names` — Rails raises for names colliding with dangerous
  class methods (`create`, `relation`, `new`, `all`, `public`, `private`,
  `protected`, `name`, `superclass`) but allows existing finders/scopes/Kernel
  methods. trails `scope()` overwrites with `Object.defineProperty` silently.

Rails source: `vendor/rails/activerecord/lib/active_record/scoping/named.rb`
(`scope`, `valid_scope_name!`) and `.../scoping/default.rb` (`default_scope`);
test bodies in `vendor/rails/.../scoping/named_scoping_test.rb`
(`test_scopes_body_is_a_callable`, `test_scopes_name_is_relation_method`,
`test_reserved_scope_names`, `test_eager_default_scope_relations_are_remove`).

## Acceptance criteria

- [ ] `scope` and `default_scope` raise `ArgumentError` with Rails-faithful
      messages on non-callable bodies / eager relations.
- [ ] `scope` rejects names colliding with `Relation` methods and dangerous
      class methods (Rails `valid_scope_name!`), allowing non-conflicts.
- [ ] Un-skip the four cases in `scoping/named-scoping.test.ts` with faithful
      bodies (already named to match Rails).

## Definition of done

The four named cases pass un-skipped; guards mirror Rails messages.
