---
title: "Cover the Symbol/method-name arm of define_callback for collection add/remove callbacks"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 60
priority: 82
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Builder::CollectionAssociation.define_callback`
(`packages/activerecord/src/associations/builder/collection-association.ts`)
mirrors Rails' three arms (`builder/collection_association.rb:44-52`): a method
name on the owner, a callable, and an object responding to the callback kind.

PR #5365 fixed and covered the object arm (`callbacks.trails.test.ts`), but the
Symbol arm — Rails `->(method, owner, record) { owner.send(callback, record) }`,
ours `(_method, owner, record) => owner[callback](record)` — has no test at all.
Every callback in the repo's models and tests is a function; nothing exercises
`hasMany("posts", { beforeAdd: "logAdd" })`. It typechecks (`CollectionCallback<K>`
admits `string`) but is unproven, and its arity differs from the other two arms
(the owner method takes only `record`), which is exactly the shape that broke
silently on the object arm.

Rails' own `AssociationCallbacksTest`
(`vendor/rails/activerecord/test/cases/associations/callbacks_test.rb:21`,
`test_adding_macro_callbacks`) uses symbol callbacks, so there is a Rails test
name to port here rather than inventing one.

## Acceptance criteria

- A test exercises the Symbol/string arm for `beforeAdd`, `afterAdd`,
  `beforeRemove` and `afterRemove`, asserting the owner method receives
  `(record)` only.
- Prefer porting the Rails test name where one covers it
  (`test_adding_macro_callbacks` → `adding macro callbacks`); anything with no
  Rails counterpart goes in `associations/callbacks.trails.test.ts`.
- Verify the test fails if the Symbol arm is changed to pass `(owner, record)`.
- Canonical models/fixtures only.

## Audit 2026-10-22

The Rails test is already ported: "adding macro callbacks"
(`associations/callbacks.test.ts:32`). It is vacuous for the Symbol arm because the
canonical `Author#postsWithCallbacks` (`test-helpers/models/author.ts:545-550`) passes
lambdas, where `author.rb:116-119` passes `before_add: :log_before_adding` etc. The converged
shape is the model: give `Author` Rails' `log_before_adding` / `log_after_adding` /
`log_before_removing` / `log_after_removing` methods and pass their names as strings, so the
existing Rails tests exercise the Symbol arm.
