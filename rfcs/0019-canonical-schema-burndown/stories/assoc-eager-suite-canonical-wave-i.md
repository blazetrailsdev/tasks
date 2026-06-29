---
title: "assoc-eager-suite-canonical-wave-i"
status: claimed
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-29T10:58:12Z"
assignee: "assoc-eager-suite-canonical-wave-i"
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-h` (RFC 0019). Wave H
converged the limited-eager cluster (`EagerLeo*`/`EagerLmo*`/`EagerLn*` →
canonical `Post`+`author`+`comments` and `Person`+`readers`/`primaryContact`/
`number1Fan`), `PrePoly*` (→ `Tagging.preload("taggable")` + `tags` fixture),
`EagerReord*` (→ anon `TempAuthor` on `authors` with `PostWithDefaultScope`
`reorderedPost` reorder scope), `Jeeo*` (→ `Post.includes("comments")`),
`Ewc*` (→ `Author.essays` + `Essay` polymorphic writer), and `Phmt*` (→
`Author.preload("readonlyComments")`) in
`packages/activerecord/src/associations/eager.test.ts`, removed those
`TEST_SCHEMA` entries, added `people`/`readers`/`essays`/`tags` to the
first block's `useFixtures`, and converged the two `Person.males` exclusive-scope
preload tests to Rails fixture form.

Remaining bespoke inline classes in the first describe block to converge:

- `ElmarMentor`/`ElmarDeveloper`/`ElmarContract`/`ElmarProject`/
  `ElmarProjectDeveloper` ("eager load multiple associations with references" —
  `eager_test.rb:1398`; canonical `Mentor`/`Developer`/`Contract`/`Project`
  HABTM developers + `references(:mentors)` double-nested includes; may surface
  an eager-load impl gap).
- `Cpk*` (`CpkOrder`/`CpkLineItem`/`CpkHmOrder`/`CpkHmItem`/`CpkHoOrder`/
  `CpkHoReceipt` — preloading belongs-to/has-many/has-one with cpk via canonical
  `cpk.ts`).
- `Idup*`/`Alar*` (categories/posts/comments through HABTM via canonical
  `Category`/`Categorization`).
- `Dp*` (deep preload), `Psta*` (preloading same association twice via canonical
  `Member`/`Membership`/`Club`), and the shared `Sg*` sponsorable models +
  `seedSponsors()` / `registerSponsorableModels()` (to canonical
  `Sponsor`/`Member`/`Organization`/`Membership`) used by the 3
  "preloading through a polymorphic association" tests.
- The wave-G readonly cluster `Pra*`/`Enra*`/`Elra*` is still present as bespoke
  inline classes in this block (if wave-G's PR did not land here) — converge or
  confirm already-converged.

Once ALL first-block bespoke inline classes are gone, remove
`defineSchema(TEST_SCHEMA)` from the first block's `beforeAll`, delete the
`TEST_SCHEMA` constant, and drop `eager.test.ts` from
`eslint/require-canonical-schema-exclude.json`.

Key Rails reference:
`vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- Remaining first-block bespoke inline classes converted to canonical models +
  fixtures (or deleted, for trails-only deviation tests).
- Test names match Rails verbatim; camelCase; no `node:` / `process.`
  references; async fs only.
- All tests pass; net skip delta documented with un-skip story.
- LOC <= 500 per PR; multiple waves allowed.
- BigInt-safe: coerce `id`/`maximum()` with `Number(...)` before arithmetic or
  sort comparators.
