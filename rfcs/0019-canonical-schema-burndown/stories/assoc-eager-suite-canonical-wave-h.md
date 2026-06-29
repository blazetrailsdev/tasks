---
title: "assoc-eager-suite-canonical-wave-h"
status: ready
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-g` (RFC 0019). Wave G
converged the readonly-association cluster (`Pra*`/`Enra*`/`Elra*` to
canonical `Firm`/`Project`/`Author`/`Post` `readonly*` associations), `Lna*`
(loading with no associations to `Post` authorless fixture), `Eabt*` (eager
belongs-to to `Comment.includes("post")`), and `Peb*` (preloading empty
belongs-to to `Client`/`firm`) in
`packages/activerecord/src/associations/eager.test.ts`, and removed their
`TEST_SCHEMA` entries. It also surfaced a preload-readonly through/HABTM gap,
tracked as `assoc-eager-preload-readonly-through-habtm-propagation`.

Remaining bespoke inline classes still in `eager.test.ts` (first describe
block) to converge to canonical models + fixtures (or delete for trails-only
deviations):

- `EagerLeo*`/`EagerLmo*`/`EagerLn*` (limited-eager,
  `eager_test.rb:976-1019` — `Post`+author+comments, `UPPER(posts.title)`
  order, limit/offset, `Person` number1-fan; may surface impl gaps, accept
  skips + un-skip follow-up).
- `PrePoly*` (preloading empty polymorphic belongs-to via `Tagging.taggable` +
  tags fixture; mind the PreloaderTest taggings registry-leak flake).
- `EagerReord*` (preloading has-one using reorder — anon `TempAuthor` on
  `authors` with `PostWithDefaultScope` + reorder scope).
- `Jeeo*` (join eager empty order), `Elmar*` (eager-load multiple assoc with
  references via `Mentor`/`Developer`/`Contract`/`Project`), `Ewc*`
  (polymorphic will not work — `Author.essays` + `Essay` polymorphic writer),
  `Phmt*` (preload has-many-through avoids reader — `Author.comments` through
  posts).
- `Cpk*` (preloading belongs-to/has-many/has-one with cpk via canonical
  `cpk.ts`).
- `Idup*`/`Alar*` (categories/posts/comments through HABTM via canonical
  `Category`/`Categorization`).
- `Dp*` (deep preload), `Psta*` (preloading same association twice via
  `Member`/`Membership`/`Club`), and the shared `Sg*` sponsorable models +
  `seedSponsors()` (to canonical `Sponsor`/`Member`/`Organization`/`Membership`).

Once ALL bespoke classes are gone, remove `defineSchema(TEST_SCHEMA)` from the
first block's `beforeAll`, delete the `TEST_SCHEMA` constant, and drop
`eager.test.ts` from `eslint/require-canonical-schema-exclude.json`.

The 22 later `EagerAssociationTest` / `EagerLoadingTooManyIdsTest` describe
blocks (lines ~2000+), each with its own inline `defineSchema(...)`, remain for
subsequent waves.

Key Rails reference:
`vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- Remaining first-block bespoke inline classes converted to canonical models +
  fixtures (or deleted, for trails-only deviation tests).
- Test names match Rails verbatim; camelCase; no `node:` / `process.`
  references; async fs only.
- All tests pass; net skip delta documented with un-skip story.
- LOC <= 500 per PR; multiple waves allowed.
- BigInt-safe: coerce `id`/`maximum()` with `Number(...)` before
  arithmetic or sort comparators.
