---
title: "Converge attribute_method_patterns default to Rails bare-pattern seed"
status: claimed
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-24T13:00:42Z"
assignee: "attribute-method-patterns-default-bare-pattern"
blocked-by: null
---

## Context

`ActiveModel::AttributeMethods` declares
`class_attribute :attribute_method_patterns, default: [ ClassMethods::AttributeMethodPattern.new ]`
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:72`). trails seeds
the backing state as `[]` instead — `Model._attributeMethodPatterns: AttributeMethodPattern[] = []`
(`packages/activemodel/src/model.ts:150`). The `attributeMethodPatterns()` accessor added in
PR #4030 (story am-attribute-method-pattern-accessors) faithfully returns this `[]`, so the
public accessor diverges from Rails' default bare pattern.

This is intentional in current trails: Rails' bare `AttributeMethodPattern.new` (empty
prefix/suffix) exists to route the plain `attribute` reader through `method_missing`. trails
has no `method_missing` and defines attribute readers as real accessor properties via
`attribute()`, so the bare pattern is omitted. Experimentally seeding
`[new AttributeMethodPattern()]` breaks 14 attribute-methods tests, because
`defineAttributeMethod → defineAttributeMethodPattern` then generates a prototype method named
`pattern.methodName(attr)` = bare `attr`, colliding with the accessor properties.

## Acceptance criteria

- Decide and implement convergence: either (a) seed the bare pattern AND gate
  `defineAttributeMethodPattern` so an empty-affix pattern does not generate a colliding bare
  `attr` method (matching how trails already exposes readers), so `attributeMethodPatterns()`
  reflects Rails' `[AttributeMethodPattern.new]` default; or (b) document a ratified deviation
  with a Rails-source rationale if convergence proves infeasible (per repo policy, prefer
  converge).
- Existing attribute-methods/dirty/attributes tests stay green; no api:compare/test:compare
  regression.
