---
title: "converge-alias-attribute-not-an-attribute-raise"
status: blocked
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: 7216
claim: "2026-08-29T17:51:37Z"
assignee: "converge-format-for-inspect-filter-order"
blocked-by: "Rails' raise fires at instantiation because load_schema! generates nothing (model_schema.rb:587-597); trails' defineAttributeMethodsAfterLoad (model-schema.ts:589) calls define_attribute_methods at the END OF A SCHEMA LOAD, so the raise fires at schema-load time instead and reds attributes.test.ts '.type_for_attribute supports attribute aliases' (attributes_test.rb:54), whose WithAlias aliases a non-attribute and is never instantiated. Dropping that generate call was tried on PR #7216 and reverted: the hook is load-bearing beyond instantiation -- base.trails.test.ts:277 ('first_name' in Developer.prototype), model-schema-load-own-table-descendant.trails.test.ts:76/100/113 (STI base _schemaLoaded) and secure-token.test.ts 'token calls the setter method' all red on 3 lanes without it. Converging the raise needs alias generation moved off the schema-load hook first (Rails keeps it lazy: generate_alias_attributes runs from define_attribute_methods, attribute_methods.rb:127-139). The PERMANENT receipt on aliasAttributeMethodDefinition was corrected to CONVERGEABLE pointing here."
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
