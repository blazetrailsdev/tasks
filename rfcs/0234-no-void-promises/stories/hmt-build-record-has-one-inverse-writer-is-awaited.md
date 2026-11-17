---
title: "has_many :through buildRecord awaits its has_one inverse writer"
status: done
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10214
claim: "2026-11-16T22:06:41Z"
assignee: "action-text-content-built-with-awaited-static-new"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/associations/has-many-through-association.ts:176`
still has `void (record.association(inverse.name) as HasOneAssociation).writer(...)`
inside `buildRecord`. Rails `through_association.rb:116-129` (`build_record`)
calls `record.send("#{inverse.name}=", build_through_record(record))`, a
synchronous call. In trails the HasOne writer (`SingularAssociation#writer` →
`replace`) returns a promise on the `build` path. trails#10157 tried the
sync-entry raise shape, and it reds `build then save with has one inverse` and
`create with conditions hash on through association`
(`has-many-through-associations.test.ts`), so the promise is load-bearing.

## Acceptance criteria

- [ ] The has_one inverse writer's promise is awaited or returned. Either
      `buildRecord` / `build` go async up to the first already-async caller, or
      the writer's async work is made synchronous for a new owner, as Rails'
      `replace` is.
- [ ] activerecord's `no-floating-promises` mark drops by one and is tightened in the PR.
- [ ] The two tests above stay green.

## Findings from trails#10199

For a new owner, Rails' `HasOneAssociation#replace`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_one_association.rb`)
runs synchronously: `load_target` returns nil with no query, `save &&= owner.persisted?`
is false, and `transaction_if(false)` yields. trails' `loadTarget` already answers
synchronously in that case, but `replace`'s save branch and `transactionIf` are
always async. The converged shape makes the save branch answer synchronously
whenever `loadTarget` does, so `buildRecord` can use `writer` without `void`.
