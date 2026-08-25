---
title: "Converge or enshrine the collection ids= throw on both owner arms"
status: closed
updated: 2026-08-09
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by RFC 0087 (active), which made awaitable writers the only association-mutation surface; the DoD's second arm is satisfied — the permanence reasoning for the ids= throw is now recorded at the call site (collection-association.ts:184-197: ids_writer resolves ids with a query even on a new owner, so the constructor arm cannot converge), and defineWriters no longer generates a sync ids setter at all (builder/collection-association.ts:167)."
---

## Context

Rails runs `ids_writer` normally for a collection `#{singular}_ids=`
assignment on **both** owner arms — `Author.new(post_ids: [...])`,
`Author.create(post_ids: [...])` and `author.post_ids = [...]` all resolve the
ids with a query and replace the collection
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:61-83`).

trails cannot: the resolution is DB I/O and a JS property setter cannot await.
PR #5292 chose to THROW `CollectionIdsAssignmentError` on both arms rather than
float a promise (an unresolvable id became an unhandled rejection, and an
immediate `save()` raced the in-flight replace). See
`packages/activerecord/src/associations/collection-association.ts:127-129` and
the deviation header of
`packages/activerecord/src/associations/collection-persisted-setter-throws.trails.test.ts:1-21`.

The awaitable surfaces exist and work — `await owner.update({ postIds: [...] })`
and `await owner.association("posts").idsWriter([...])` — so this is a
_surface_ deviation, not a missing capability. Surfaced again by PR #5308,
which had to rewrite three constructor-form tests to assert the throw.

## Acceptance criteria

- Decide whether the throwing arms can converge on Rails, or whether the
  deviation is permanent and should be recorded as such.
- The constructor / `create` arm is the most tractable: the owner is always new,
  so a deferred resolve-and-replace at the owner's first `save()` may be
  faithful without racing (Rails does no I/O for the record writer on a new
  owner either). If so, `new Author({ postIds: [...] })` should stop throwing.
- The persisted arm likely stays a throw — document why at the call site rather
  than only in the PR body.
- Any converged arm keeps a bad id catchable (no unhandled rejection) and
  cannot race an immediate `save()`.

## Definition of done

Either the constructor/`create` arm no longer throws and is covered by tests in
`collection-persisted-setter-throws.trails.test.ts`, or the deviation is
confirmed permanent with the reasoning recorded at
`collection-association.ts:127`.

## Verification

`pnpm vitest run packages/activerecord/src/associations/collection-persisted-setter-throws.trails.test.ts`
plus `has-many-associations.test.ts` and `nested-attributes.test.ts`.
