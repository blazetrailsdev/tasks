---
title: "ActiveModel attribute-method patterns map a `?` suffix to a `has` prefix"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-generated-predicates
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruled 2026-10-26: generated attribute predicates are `has*`. Rails' `attribute_method_suffix "?"` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb`, `AttributeMethodPattern`) builds `"#{prefix}#{attr}#{suffix}"`. trails' pattern machinery in `packages/activemodel/src/attribute-methods.ts` builds the same literal, so `attributeMethodSuffix("?")` yields a `title?` member.

This story maps a pattern whose suffix ends in `?` to the TS spelling `has` + camel name (`title?` → `hasTitle`). It also maps the reverse direction (matching a method name back to its attribute), so `hasTitle` resolves to `title`. The generated member stays a getter (CLAUDE.md § "Generated attribute readers are properties"), and generation still skips a name the class already answers. ActiveRecord's adoption is `ar-generated-attribute-predicate-spelling`.

## Acceptance criteria

- [ ] A model declaring `attributeMethodSuffix("?")` answers `hasTitle`, and no `"title?"` member is generated.
- [ ] Method-name matching resolves `hasTitle` to the `title` attribute.
- [ ] A class that already defines `hasX` keeps its own member.
- [ ] ActiveModel attribute-method tests are updated without renaming any.
