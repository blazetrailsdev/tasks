---
title: "Converge remaining eager.test.ts bespoke clusters to canonical (wave G)"
status: done
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: 3
pr: 4253
claim: "2026-06-29T09:02:14Z"
assignee: "assoc-eager-suite-canonical-wave-g"
blocked-by: null
---

## Context

Continuation of `assoc-eager-suite-canonical-wave-f` (#4252, RFC 0019). Wave F
converged the firm/client/account/comment clusters in the first
`EagerAssociationTest` describe block of
`packages/activerecord/src/associations/eager.test.ts` onto canonical
`Firm`/`Client`/`Account`/`Comment` models + fixtures, removed the bespoke
classes `StiShare*`/`EagerMultiHo*`/`EagerMultiBt*`/`EagerPk*`/`IncPk*`/
`EagerEmptyBt*` and their `TEST_SCHEMA` entries, and added a `findAllOrdered`
helper (mirrors eager_test.rb:1770).

Remaining bespoke inline classes still in `eager.test.ts`:

- First-block clusters: `EagerLeo*`/`EagerLmo*`/`EagerLn*` (limited-eager,
  eager_test.rb:976-1019 — real versions use Post+author+comments fixtures,
  UPPER(posts.title) order with limit/offset, Person number1_fan; converting
  may surface impl gaps, accept skips + un-skip follow-up), `PrePoly*`
  (preloading empty belongs to polymorphic — needs Tagging.taggable + tags
  fixture; mind the PreloaderTest taggings registry-leak flake),
  `EagerReord*` (preloading has one using reorder — Rails uses an anon
  TempAuthor on `authors` with `PostWithDefaultScope` + reorder scope),
  `Jeeo*`, `Elmar*`, `Pra*`/`Enra*`/`Elra*`/`Ewc*`/`Phmt*`, `Cpk*`,
  `Idup*`/`Alar*`, `Lna*`, `Eabt*`, `Peb*`, `Dp*`, `Psta*`, and the shared
  `Sg*` sponsorable models + `seedSponsors()`.
- The 22 later `EagerAssociationTest` / `EagerLoadingTooManyIdsTest` describe
  blocks (lines ~2000+), each with its own inline `defineSchema(<inline>)`.

Final wave (G, H, ... as needed): once ALL bespoke classes are gone, remove
`defineSchema(TEST_SCHEMA)` from the first block's `beforeAll`, delete the
`TEST_SCHEMA` constant, and drop `eager.test.ts` from
`eslint/require-canonical-schema-exclude.json` (the lint rule is file-scoped,
so the exclude cannot be dropped until the file is fully canonical).

Key Rails reference:
`vendor/rails/activerecord/test/cases/associations/eager_test.rb`.

## Acceptance criteria

- Remaining bespoke inline classes converted to canonical models + fixtures
  (or deleted, for trails-only deviation tests).
- Test names match Rails verbatim; camelCase; no node:_/process._; async fs only.
- All tests pass; net skip delta documented with un-skip story.
- LOC <= 500 per PR; multiple waves allowed (wave G, H, ... as needed).
- BigInt-safe: coerce `id`/`maximum()` results with `Number(...)` before
  arithmetic or sort comparators (PG/MariaDB return BigInt) — see wave F #4252.
