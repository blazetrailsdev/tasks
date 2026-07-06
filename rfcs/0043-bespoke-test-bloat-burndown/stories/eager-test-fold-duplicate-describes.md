---
title: "Fold the canonical EagerAssociationTest describes into one shared-fixture suite"
status: claimed
updated: 2026-07-06
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 6
pr: null
claim: "2026-07-06T13:29:08Z"
assignee: "eager-test-fold-duplicate-describes"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/eager.test.ts` is **3,110 lines** — well
over Rails' `eager_test.rb` (~1,773 lines) for a comparable test count. The inline
schema is no longer the driver (the canonical conversion is done — `defineSchema`
count in the file is **0**). The residual bloat is **structural fragmentation**:
the file holds **22 separate `describe("EagerAssociationTest")` blocks** (plus a
distinct `EagerLoadingTooManyIdsTest`), each repeating its own `fixtures([...])`
declaration. Rails models the same suite as a **single** `EagerAssociationTest`
class with one `fixtures` declaration.

This is a conversion artifact: each canonical-schema wave carved its slice into a
new same-named describe instead of merging into one shared-fixture suite.

### Scope: this is a PARTIAL fold — not all 22 blocks are foldable

Verified 2026-07-06 against the current file:

- **No duplicate `it()` names** across the blocks — merging will not collide and
  will not disturb `test:compare` name matching.
- The file no longer uses `setupHandlerSuite()`/`useHandlerFixtures()`; the
  current idiom is the endgame `fixtures([...])` surface (`test-helpers/fixtures.js`).
  Transactional fixtures roll back per-test, so a shared fixture declaration does
  not leak mutations between the folded tests — a superset load is correctness-safe
  (only marginally slower per test).
- **Fold host:** the primary block (line 83) already carries the shared
  `beforeAll` that registers the CPK / default-scope models
  (`PostWithDefaultScope`, `CpkOrder`, `CpkBook`, `Mentor`, `Contract`,
  `AuditLog`, `FirstPost`) and declares 25 canonical fixtures. Fold the other
  **plain-canonical** `describe("EagerAssociationTest")` blocks into it, extending
  its `fixtures([...])` to the union.
- **Canonical union = 32 fixtures**: the primary block's 25 plus the 7 that other
  foldable blocks add — `categoriesPosts, categorizations, jobs, owners, pets,
references, taggings`. (Full set: accounts, authorAddresses, authorFavorites,
  authors, books, categories, categoriesPosts, categorizations, clubs, comments,
  companies, developers, developersProjects, essays, jobs, mateys, members,
  memberships, owners, parrots, people, pets, pirates, posts, projects, readers,
  references, sponsors, subscribers, subscriptions, taggings, tags.)

**Do NOT fold these — they keep their own describe + setup:**

- The **two sharded blocks** (the `shardedBlogs / shardedBlogPosts /
shardedComments / shardedTags / shardedBlogPostsTags` describes). They load the
  sharded fixtures and one runs its own `beforeAll` dynamically importing and
  `registerModel`-ing the sharded + CPK models (`ShardedBlog`, `ShardedBlogPost`,
  `ShardedComment`, `ShardedTag`, `ShardedBlogPostTag`, `CpkPost`, `CpkComment`).
  That model-registration setup is not shared with the canonical union and must
  stay local. (The `{ schema: canonicalSchema }` arg these once passed was
  removed in PR #4593 — the fixtures schema arg is gone repo-wide — so it is no
  longer a reason to keep them separate; the model registration is.)
- **`EagerLoadingTooManyIdsTest`** — mirrors a separate Rails class and now runs
  **non-transactionally** (`fixtures({}, { useTransactionalTests: false })`);
  keeps its own describe + `beforeAll`.

- trails: `associations/eager.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`
  (single `EagerAssociationTest` class).

## Dependency / ordering

The blocking canonical conversion has **landed** — `assoc-eager-suite-canonical-wave-g`
(PR #4253) and `assoc-eager-suite-canonical-wave-h` (PR #4258) are done, and the
file's `defineSchema` count is 0. This story is now unblocked; deps are recorded
as met (both waves closed).

## Acceptance criteria

- [ ] Fold the **plain-canonical** `describe("EagerAssociationTest")` blocks into
      the primary block (line 83), extending its single `fixtures([...])` to the
      32-fixture canonical union above. Delete the per-slice `describe` +
      `fixtures([...])` scaffolding.
- [ ] The **two sharded blocks** and `EagerLoadingTooManyIdsTest` stay as their
      own describes with their existing per-block `fixtures(...)` / `beforeAll`
      model-registration / non-transactional setup intact.
- [ ] Test names and bodies UNCHANGED (`test:compare` matches on names); only the
      surrounding describe/fixtures scaffolding of the folded blocks is removed.
- [ ] No remaining per-slice `beforeAll` that only re-declares fixtures; any
      genuinely test-specific setup stays local to the relevant tests.
- [ ] `pnpm vitest run packages/activerecord/src/associations/eager.test.ts`
      passes on sqlite (and PG if any block is PG-gated); `pnpm lint` clean;
      `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Net line reduction (deletion of repeated `describe`/`fixtures` scaffolding)
      with zero test-count change.

Hard rules: NO `node:*` imports, NO `process.*` refs, async fs only, no new
runtime deps. 500 LOC ceiling (this is deletion-heavy; code-motion counts —
keep it to the one file). NO stacked PRs — single PR from main.

## Definition of done

`eager.test.ts` has one primary `EagerAssociationTest` describe holding all the
canonical tests under a single shared `fixtures([...])` declaration, with the two
sharded blocks and `EagerLoadingTooManyIdsTest` preserved as their own describes,
identical test names/bodies, and passing.
