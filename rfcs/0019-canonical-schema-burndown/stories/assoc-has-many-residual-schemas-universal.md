---
title: "Converge has-many-associations.test.ts UNIVERSAL + tail bespoke schemas → drop exclude entry"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 500
priority: 84
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `assoc-has-many-residual-schemas` (RFC 0019). That story
converged the two smallest residual bespoke schemas in
`packages/activerecord/src/associations/has-many-associations.test.ts`
(`HEAD_SCHEMA`, `TAIL_ASYNC_SCHEMA`) to canonical models/fixtures. The file
**stays on `eslint/require-canonical-schema-exclude.json`** until the remaining
residual schemas below are also converged — this story owns that and the
exclude-entry drop.

Remaining bespoke schema consts + their `defineSchema(...)` describes:

- `UNIVERSAL_HM_SCHEMA` (~line 83) — backs **~203 tests** in one
  `describe("HasManyAssociationsTest")` (the `beforeAll`
  `defineSchema(UNIVERSAL_HM_SCHEMA)` block). ~300 prefixed scratch tables
  (`clear_dep_posts`, `cpk_authors`, `dep_firms`, …) backing per-test inline
  models. This is the bulk.
- `TAIL_HMT_SCHEMA` (~line 7160) — 10 tests.
- `TAIL_HMT2_SCHEMA` (~line 7491) — 2 tests.
- `COUNTER_CACHE_HEAD_SCHEMA` (~line 7573) — 4 tests.

### Key findings (do not re-derive)

- These are **divergent inline-model STUBS**, not mechanical schema users.
  Faithful convergence = rewriting each test against
  `vendor/rails/.../has_many_associations_test.rb` using the canonical models in
  `test-helpers/models/` + fixtures, matching the Rails test of the same name.
- Canonical `posts` has `title` AND `body` NOT NULL (no default); canonical
  `authors` has no `posts_count`. So inline `Post.create({author_id,title})`
  fails on canonical `posts`, and author counter-cache stubs must map to the
  real Rails counter-cache models (Topic/Reply `replies_count`, Ship
  `treasures_count`, Car/Wheel), not invented `authors.posts_count`.
- Pattern to follow: see the already-converged describes in the same file
  (companies/clients + `useHandlerFixtures`, lines ~620–1004), and the
  HEAD/ASYNC describes converged by the parent story.

### Tail-test → Rails model map (researched)

- "do not call callbacks for delete all" → Car + `funkyBulbs` (FunkyBulb), `.deleteAll`.
- "find first after reset" → `Firm.first.clients` first-caching + `reset`.
- "deleting updates counter cache" → Topic/replies (`replies_count`).
- "destroy dependent when deleted from association" → `Firm.clients.delete(client)` → RecordNotFound.
- "replace with less and dependent nullify" → `companies(:rails_core).companies = []` (DependentFirm, dependent: nullify).
- "calling one should return true if one" → `firm.limitedClients.one?`.
- "abstract class with polymorphic has many" → SubStiPost + Tagging (`taggable`).
- "with polymorphic has many with custom columns name" → Post + `images` (Image, custom imageable_identifier/imageable_class).
- "destroy does not raise when association errors on destroy" → Rails uses
  `AuthorWithErrorDestroyingAssociation`, which **does not yet exist** in
  `test-helpers/models/` — add the canonical model (vendor author.rb) or skip.
- "has many preloading with duplicate records" → `Post.joins("comments").preload("comments")`.
- "custom named counter cache" → `topics(:first).approvedReplies.clear`, replies_count -1.
- "restrict with exception" → `RestrictedWithExceptionFirm` (companies), DeleteRestrictionError.
- "has many without counter cache option" → Ship + treasures (no cached counter).
- "counter cache updates in memory after create" / "pushing association updates counter cache" → Topic + replies.
- "calling empty with counter cache" → `posts(:welcome).comments` not empty under assertNoQueries.

Needed model imports already verified present: Topic, Reply/SillyReply, Ship,
Treasure, Image, FunkyBulb, SubStiPost/StiPost, RestrictedWithExceptionFirm,
DependentFirm (company.ts). Missing: AuthorWithErrorDestroyingAssociation.

### Impl-gap dependencies (skip-then-unskip)

Some converged tests fail on real impl gaps; owner approved test:compare
regression via `it.skip` + tracked unskip stories:

- `collection-proxy-destroy-transaction` (+ `unskip-has-many-collection-destroy-transaction`)
- `assoc-async-load-target-shares-proxy-state` (+ `unskip-async-load-has-many`)
  Expect more to surface during the UNIVERSAL port; register impl + unskip stories
  per the same pattern rather than fixing inline.

## Acceptance criteria

- [ ] Converge `UNIVERSAL_HM_SCHEMA`, `TAIL_HMT_SCHEMA`, `TAIL_HMT2_SCHEMA`,
      `COUNTER_CACHE_HEAD_SCHEMA` describes onto canonical models/fixtures,
      faithful to the like-named Rails tests; delete the bespoke schema consts.
- [ ] Tests that fail on impl gaps are `it.skip` with a comment + a registered
      impl story + unskip story (do NOT fix impl inline).
- [ ] File **removed from `eslint/require-canonical-schema-exclude.json`**;
      `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts`
      passes on sqlite (skips allowed per above).
- [ ] Test names unchanged (test:compare matching).

## Definition of done

Fidelity is the deliverable. May be split per-describe across PRs (RFC 0019
exempts this file from the 500-LOC ceiling), but the exclude entry drops only in
the PR that removes the last bespoke schema.
