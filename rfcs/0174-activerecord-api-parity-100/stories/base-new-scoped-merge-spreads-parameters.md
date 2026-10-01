---
title: "Base.new merges scope attributes by spreading the raw argument, so a scoped new(params) spreads a Parameters instance"
status: closed
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
closed-reason: "fixed in trails#8308 (merge sanitizes first); remaining convergence tracked by base-new-and-create-merge-scope-for-create-into-attributes"
---

## Context

`Base._mergeCurrentScopeAttrs` (`packages/activerecord/src/base.ts`, called from `Base.new`)
returns `{ ...scopeAttrs, ...attrs }` whenever a scope is current. It runs before the
constructor's `sanitizeForMassAssignment`, so when `attrs` is an
`ActionController::Parameters` (typed `PermittedAttributes` since the
`strong-parameters-expect-returns-unknown` PR), the spread copies the instance's own fields
(`_data`, `_permitted`, `loggingContext`) instead of its keys. The result is a plain object,
so `sanitizeForMassAssignment` no longer sees `permitted`, and `Post.where(x).new(params)`
assigns `_data` as an attribute (UnknownAttributeError) instead of the permitted keys, and
skips the ForbiddenAttributesError check for unpermitted params.

Rails keeps the two apart: `Core#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`)
calls `initialize_internals_callback`, whose `Scoping#populate_with_current_scope_attributes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping.rb:47-57`) `_assign_attributes` the
scope attributes, then `super` hands the caller's attributes to ActiveModel's
`assign_attributes`, which sanitizes them.

## Acceptance criteria

- [ ] `Base.new` no longer merges scope attributes into the raw argument; the scope
      attributes reach the record through the `populate_with_current_scope_attributes` path.
- [ ] A test: a scoped `new` given a permitted `Parameters` assigns its keys, and an
      unpermitted one raises `ForbiddenAttributesError`.
