---
title: "converge-alias-attribute-not-an-attribute-raise"
status: ready
updated: 2026-09-01
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::AttributeMethods::ClassMethods#alias_attribute_method_definition`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:87-97`)
raises `ArgumentError` when the aliased target is not an attribute:

```ruby
if !abstract_class? && !has_attribute?(old_name)
  raise ArgumentError, "#{self.name} model aliases `#{old_name}`, but `#{old_name}` is not an attribute. " \
    "Use `alias_method :#{new_name}, :#{old_name}` or define the method manually."
```

trails' port at `packages/activerecord/src/attribute-methods.ts:243` drops that
branch entirely and carries a `@missingRailsCall has_attribute? — PERMANENT`
receipt for it. That receipt is debt, not permission (CLAUDE.md, "A documented
deviation is debt, not permission"): the guard is ordinary control flow, not a
TypeScript shortcoming, so it converges.

Four `AttributeMethodsTest` arms exist only to exercise it and are still
placeholder-shaped on `makeModel()` in
`packages/activerecord/src/attribute-methods.test.ts`:

- `#alias_attribute with an _in_database method issues raises an error` (:1464)
- `#alias_attribute with enum method raises an error` (:1488)
- `#alias_attribute with an association method raises an error` (:1515)
- `#alias_attribute with a manually defined method raises an error` (:1554)

Each asserts the exact `ArgumentError` message, and each names its class via
`def self.name`, so the port needs the trails spelling of `self.name` in the
message.

Two neighbours in the same file are also still on `makeModel()` and belong with
this work because they turn on the same generation path:
`#alias_attribute with an overridden original method along with an overridden
alias method uses the overridden alias method` (:1414) and its
`... in a parent class ...` sibling (:1421), plus
`#alias_attribute with the same alias as parent doesn't issue a deprecation`
(:1443).

## Acceptance criteria

- [ ] `aliasAttributeMethodDefinition` raises Rails' `ArgumentError` with Rails'
      message; the `@missingRailsCall has_attribute?` receipt is deleted.
- [ ] The four raise arms plus the three neighbours read canonical models and
      assert what Rails asserts.
- [ ] `pnpm parity:api:calls` / `pnpm parity:test:assertions` deltas
      non-negative; AR suite green on all three lanes.
