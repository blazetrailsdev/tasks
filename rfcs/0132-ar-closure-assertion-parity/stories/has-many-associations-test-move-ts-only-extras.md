---
title: "Move has-many-associations.test.ts TS-only extras to the trails file"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#7983, `packages/activerecord/src/associations/has-many-associations.test.ts` mirrors
the member order of `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.
Six TS-only tests with no Rails counterpart are still in that convention file. Each one sits
right after the Rails test it followed before the re-sort. `parity:test` counts them as
`Extra 7` for the file:

- `adding buffers a record whose save fails into the target`
- `creating a record whose save fails buffers it into the target`
- `destroy returns the removed records`
- `depends and nullify with composite foreign key nulls every FK column` (it.skip; bespoke
  `NullifyCompositeAuthor` / `NullifyCompositePost` models)
- `isAssociationCached reflects built Association instances` (bespoke `CacheAuthor` / `CachePost`)
- `collection destroy uses destroy bang and rolls back the batch on failure` (bespoke
  `HaltingComment` / `PostWithHaltingComments`)
- `deleting composite-key records scopes by tuple, not cartesian product` (canonical `CpkOrder` / `CpkBook`)

Note that the list has seven entries, while the context above says six and `parity:test`
reports `Extra 7`. Count them against the file when you pick this up.

Precedent: `callbacks-test-move-ts-only-extras` (done).

## Acceptance criteria

- For each test, check whether a canonical test already covers the behavior. If one does, delete the extra.
- Move the remaining extras to `has-many-associations.trails.test.ts`, using canonical models
  and tables only. Rewrite the bespoke models onto canonical ones, or drop the test.
- `parity:test` `Extra` for `has_many_associations_test.rb` goes to 0, and OK/Miss do not regress.
