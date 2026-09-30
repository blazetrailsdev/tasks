---
title: "Base.new and create merge scope_for_create into the caller's attributes; Rails assigns scope attributes only through populate_with_current_scope_attributes"
status: draft
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

`Base.new` and `Persistence.create` / `createBang` (`packages/activerecord/src/base.ts`
`_mergeCurrentScopeAttrs`, `packages/activerecord/src/persistence.ts:66,93`) merge the current
scope's `scopeForCreate()` into the caller's attributes before constructing the record. The
constructor then applies the scope attributes a second time through `_applyScopeAttributes`
(`base.ts`, `scopeAttributes`) for every key the caller did not pass. trails#8308 made the merge
sanitize the caller's attributes first, so a `Parameters` is no longer spread raw, but the two
mechanisms remain.

Rails has one path. `Core#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`)
calls `initialize_internals_callback`, whose `Scoping#populate_with_current_scope_attributes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping.rb:47-57`) `_assign_attributes` the
`scope_attributes`, and then `super` passes the caller's attributes to ActiveModel's
`assign_attributes`. `Base.new` (`inheritance.rb`) and `create` (`persistence.rb:33-58`) never
merge anything into the argument.

## Acceptance criteria

- [ ] `_mergeCurrentScopeAttrs` is deleted. `Base.new` and `create` / `createBang` pass the
      caller's attributes straight to the constructor, and scope attributes reach the record
      only through the constructor's `populate_with_current_scope_attributes` path.
- [ ] The scoped tests in `forbidden-attributes-protection.trails.test.ts`
      (`ForbiddenAttributesProtectionNewTest`) and the existing scoping tests stay green.
