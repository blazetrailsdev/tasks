---
title: "Extend isAttributeMethodsGenerated onto Base (attribute_methods_generated?)"
status: draft
updated: 2026-11-09
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `attribute_methods_generated?` in `ActiveRecord::AttributeMethods::ClassMethods` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:98-100`), so every model answers it. trails ports the body as `isAttributeMethodsGenerated` (`packages/activerecord/src/attribute-methods.ts:331`), but the function is never attached to `Base`: `packages/activerecord/src/base.ts` extends `defineAttributeMethods` / `undefineAttributeMethods` (around :2138) and not this one, so `Post.isAttributeMethodsGenerated()` is a `TypeError`.

Converged shape, tried and reverted in trails#9932: import `isAttributeMethodsGenerated as _isAttributeMethodsGenerated`, add a `declare static isAttributeMethodsGenerated: typeof _isAttributeMethodsGenerated;` and an `isAttributeMethodsGenerated: _isAttributeMethodsGenerated` entry in the `extend(Base, { … })` block next to `defineAttributeMethods`.

## Acceptance criteria

- `Base.isAttributeMethodsGenerated` is extended onto Base under its Rails name.
- `parity:api` credits it and `parity:api:extra` doesn't grow.
- It ships together with, or ahead of, `port-active-record-define-attribute-methods-initializer`, whose `FrameworksTest` "define attribute methods when schema cache is present and check_schema_cache_dump_version is false" asserts `assert_predicate Post, :attribute_methods_generated?`.
