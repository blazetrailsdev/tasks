---
title: "Fold 22 duplicate EagerAssociationTest describes into one shared-fixture suite"
status: draft
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/eager.test.ts` is ~4,088 lines — 2.3x
Rails' `eager_test.rb` (1,773 lines) for ~1.3x the tests (202 vs 157), i.e.
~20 lines/test vs Rails' ~11. The inline schema is no longer the driver (~7% of
the file). The bloat is **structural fragmentation**: the file contains **22
separate `describe("EagerAssociationTest")` blocks** (plus 1
`EagerLoadingTooManyIdsTest`), each repeating its own `setupHandlerSuite()` /
`beforeAll` / `useHandlerFixtures(...)` scaffolding. Rails models the exact same
suite as a **single** `EagerAssociationTest` class with one `fixtures`
declaration.

This is a conversion artifact: each canonical-schema wave carved its slice into
a new same-named describe instead of merging into one shared-fixture suite.
Collapsing the 22 blocks into one removes ~250–300 lines of repeated boilerplate
and matches the Rails structure.

Evidence the fold is safe (verified 2026-06-29):

- **No duplicate `it()` names** across the 22 blocks — merging will not collide
  and will not disturb `test:compare` name matching.
- Every block already pulls **canonical** fixtures; the union is 21 fixtures:
  `accounts, authorFavorites, authors, clubs, comments, companies, developers,
developersProjects, essays, jobs, members, memberships, owners, people, pets,
posts, projects, references, sponsors, taggings, tags`.
- Transactional fixtures roll back per-test, so a shared `beforeAll`/fixture
  declaration does not leak mutations between the folded tests.

- trails: `associations/eager.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`
  (single `EagerAssociationTest` class).

## Dependency / ordering

This is a **post-conversion consolidation** and must run AFTER the RFC 0019
canonical conversion of this file (`assoc-eager-suite-canonical-wave-g` and any
follow-on eager waves) lands — once the per-block `defineSchema(...)` calls are
gone, the blocks differ only by their fixture list and fold trivially. Do NOT
fold while bespoke `defineSchema` remains (that just merges scaffolding around
tables that still collide). Set `deps` accordingly when the conversion story is
known/closed.

## Acceptance criteria

- [ ] Collapse the 22 `describe("EagerAssociationTest")` blocks into a SINGLE
      `describe("EagerAssociationTest")` with one `setupHandlerSuite()` and one
      `useHandlerFixtures([...])` declaring the unioned canonical fixture set.
      (`EagerLoadingTooManyIdsTest` stays its own describe — it mirrors a
      separate Rails class.)
- [ ] Test names and bodies UNCHANGED (`test:compare` matches on names); only
      the surrounding describe/setup scaffolding is removed.
- [ ] No remaining per-slice `beforeAll` that only re-declares schema/fixtures;
      any genuinely test-specific setup stays local to the relevant tests.
- [ ] `pnpm vitest run packages/activerecord/src/associations/eager.test.ts`
      passes on sqlite (and PG if any block is PG-gated); `pnpm lint` clean;
      `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Net line reduction (expect ~250–300 fewer lines) with zero test-count
      change.

Hard rules: NO `node:*` imports, NO `process.*` refs, async fs only, no new
runtime deps. 500 LOC ceiling (this is deletion-heavy; code-motion counts —
keep it to the one file). NO stacked PRs — single PR from main.

## Definition of done

`eager.test.ts` has one `EagerAssociationTest` describe with a single shared
canonical fixture declaration, no per-slice setup duplication, identical test
names/bodies, and passes. Folding while bespoke `defineSchema` still remains is
NOT done.
