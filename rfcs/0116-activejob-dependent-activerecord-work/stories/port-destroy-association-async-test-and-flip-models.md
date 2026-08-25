---
title: "Port destroy_association_async_test.rb and flip the canonical models to dependent: :destroy_async"
status: draft
updated: 2026-08-21
rfc: "0116-activejob-dependent-activerecord-work"
cluster: null
packages: ["activerecord"]
deps: ["port-after-commit-jobs-callback", "port-destroy-association-async-job"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/activejob/destroy_association_async_test.rb` is
**367 code lines / 21 tests** and is the only Rails coverage of the whole
`:destroy_async` chain — `has_many`, `has_many :through`, `has_one`,
`belongs_to`, the polymorphic arms, the `ensuring_owner_was` guard, and the
"does not enqueue when the transaction rolls back" case.

Its models are the `*_destroy_async` fixtures trails already carries —
`book-destroy-async.ts`, `essay-destroy-async.ts`, `destroy-async-parent.ts`,
`destroy-async-parent-soft-delete.ts`, `dl-keyed-belongs-to.ts` and
`dl-keyed-belongs-to-soft-delete.ts` (Rails has ten files matching
`destroy_async` under `test/models/`) — every one of which still declares the
**non-async** dependent option behind a comment like:

```ts
// Rails uses dependent: :destroy_async. The runtime accepts "destroyAsync" but
// AssociationOptions.dependent type union doesn't include it yet; using "destroy" until the type is widened.
```

**Both halves of that comment are now false, and this is the story's main
trap.** The union at `packages/activerecord/src/associations.ts:92-98` already
reads `"destroy" | "destroyAsync" | "nullify" | "delete" |
"restrictWithException" | "restrictWithError"` — `destroyAsync` is in it. And
the runtime arm behind it landed in PR #6762 (merged 2026-08-20) across
`BelongsToAssociation#handleDependency`, `HasManyAssociation#handleDependency`
and `HasOneAssociation#delete`; before that merge the flip would have silently
routed `has_many` through the `delete_all` arm. So nothing blocks the flip
itself any more — only the absence of a drain (story 1) and a job (story 2)
makes it unobservable. Delete those six stale comments as part of this story;
do not propagate them.

This story is the capstone: with the drain (story 1) and the job (story 2) in
place, these 21 tests are what proves the chain end to end.

## Acceptance criteria

- All 21 tests ported at the Rails path with names verbatim; `parity:test`
  delta for activerecord **+21 or better**.
- Every `*-destroy-async` / `dl-keyed-*` canonical model declares
  `dependent: "destroyAsync"` (plus `ensuringOwnerWas` where Rails has
  `ensuring_owner_was:`), matching its `vendor/rails/activerecord/test/models/*.rb`
  counterpart field for field, and the six stale "until the type is widened"
  comments are gone. No bespoke models, no invented
  tables — anything the tests need comes from the canonical schema.
- `destroy-async-dependent-arm.trails.test.ts` — the trails-only cover written
  while ActiveJob was absent — is deleted, or reduced to only the assertions the
  Rails tests do not make, with a comment saying which.
- The rollback case genuinely fails on a baseline that drops the
  `after_commit` registration (a regression test must fail on baseline).
- SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Definition of done

Not done if the models are flipped but the Rails tests are skipped or partially
enrolled — the flip without the tests is an unobserved behaviour change, and the
tests without the flip do not exercise the canonical models.
