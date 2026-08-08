---
title: "Ported tests call the free findTarget where Rails uses the association reader"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6188
claim: "2026-08-07T17:21:52Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

Several ported AR tests call the free `findTarget(record, name, options)` from
`associations/singular-association.ts` where the Rails test they mirror uses the
association reader. #6139 hit this as red CI: two of them
(`associations.test.ts:1040`, `:1226`) only passed because the loader wrote its
result back into the holder, and broke the moment that tail was removed to match
`singular_association.rb:47-55`. Both were converged to the reader in that PR:

- `associations_test.rb:1312` — `bob = bob_post.author`
- `associations_test.rb:1467` — `comment.blog_post`

The same substitution is still in place elsewhere. Known sites:

- `packages/activerecord/src/associations.test.ts:881,884` — `findTarget(fav,
"author", { inverseOf: "authorFavorites" })` / `findTarget(fav,
"favoriteAuthor", {})`, in "preload with grouping sets inverse association".
- `packages/activerecord/src/associations/association-scope.test.ts:293,519,699,747,787`
- `packages/activerecord/src/associations/disable-joins-nested-through.test.ts:148,183`
- `packages/activerecord/src/associations/disable-joins-composite-nested.test.ts:175,199`
- `packages/activerecord/src/associations/disable-joins-polymorphic-nonid-pk.test.ts:171`
- `packages/activerecord/src/associations/association-scope-cache.test.ts`,
  `has-many-associations.test.ts`, `join-model.test.ts`

These are green today, but each one asserts against a path Rails' test does not
take, so they under-test the reader and over-test a trails-only seam — and they
are what makes that seam hard to delete.

## Converged shape

Each call site reads through the association the way its Rails counterpart does
— the generated accessor (`record.assocName`, which is
`this.association(name).reader`, `builder/association.ts:230`) where Rails uses
the reader, or `record.association(name).loadTarget()` where the test genuinely
needs the holder. Read the Rails test first in each case; do not rename tests.

Sites whose Rails counterpart genuinely has no reader form (a `disable_joins`
scope assertion, say) can stay, but should say so at the call site rather than
being left unmarked.

## Acceptance criteria

- [ ] Every listed call site either routes through the association object or
      carries a one-line note naming the Rails test line that has no reader form.
- [ ] No test names change.
- [ ] Association / preloader / disable-joins suites pass on SQLite, PostgreSQL
      and MySQL.
- [ ] Unblocks `inline-singular-find-target-into-the-method`.
