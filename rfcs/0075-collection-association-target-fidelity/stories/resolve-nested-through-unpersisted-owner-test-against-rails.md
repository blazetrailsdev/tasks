---
title: "Nested-through unpersisted-owner test asserts non-Rails behaviour and blocks the toArray collapse"
status: draft
updated: 2026-08-20
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
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

`has-many-through-associations.test.ts:2337`,
`it("nested has many through association with unpersisted parent instance")`,
has no Rails counterpart — `grep -rn "unpersisted parent"
vendor/rails/activerecord/test` is empty — and it asserts behaviour Rails does
not have.

The test builds an unpersisted `post` with `hasMany("books", { through: "author" })`
and `hasMany("subscriptions", { through: "books" })`, sets `post.author`, and
expects `post.subscriptions.toArray()` to re-traverse the in-memory chain on
each read.

In Rails that read is `[]`. The through reflection for `subscriptions` is
`books`, itself a has_many-through, so `ThroughAssociation#foreign_key_present?`
(`vendor/rails/activerecord/lib/active_record/associations/through_association.rb:90-94`)
is false because `through_reflection.belongs_to?` is false; `owner.new_record?`
is true; so `find_target?`
(`.../associations/association.rb:320-322`) is false and `load_target`
(`.../associations/collection_association.rb:272-279`) skips the query, runs
`loaded!`, and returns the untouched target.

The only thing keeping the test green is the cache-bypassing arm in
`CollectionProxy#toArray`, which is what
`0114-collection-proxy-decomposition/collapse-collection-proxy-toarray-onto-load`
exists to delete. That story is currently `blocked` on precisely this: verified
on PR #6758's branch, implementing Rails' `load_target` shape literally fixes
the autosave arm the story predicted would break and reds exactly this one test.

This story is the test-side half of that unblock, separable from the RFC 0075
`_queryExecutor` work the collapse also needs.

## Converged shape

Decide, against Rails, what `post.subscriptions` should return for an
unpersisted owner whose through chain is not `belongs_to`-rooted, and make the
test assert that. If the answer is Rails' `[]`, the test converges to it. If
trails deliberately keeps the in-memory traversal, the test moves to a
`.trails.test.ts` sibling with a `@noRailsEquivalent`-style justification at the
assertion, so it stops reading as a mirrored Rails test in a mirrored file —
per the repo rule that TS-only extras live in the trails test file.

Do NOT converge by deleting the assertion outright without establishing which
of the two it is.

## Acceptance criteria

- The nested-through unpersisted-owner behaviour is stated against a Rails cite
  (`association.rb:320-322`, `through_association.rb:90-94`,
  `collection_association.rb:272-279`).
- No test with no Rails counterpart remains under a mirrored-Rails test name in
  `has-many-through-associations.test.ts`.
- `collapse-collection-proxy-toarray-onto-load` is no longer blocked by this
  test (its RFC 0075 dependencies may still block it).
