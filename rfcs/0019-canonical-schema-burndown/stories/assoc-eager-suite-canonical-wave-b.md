---
title: "assoc-eager-suite-canonical-wave-b"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4244
claim: "2026-06-28T20:31:47Z"
assignee: "assoc-eager-suite-canonical-wave-b"
blocked-by: null
---

## Context

Continues `assoc-eager-suite-canonical` (RFC 0019). Wave A (PR #TBD) converted 9 tests
in the first EagerAssociationTest block to canonical models. Wave B covers the remaining
bespoke tests inside that same block.

Key source files:

- `packages/activerecord/src/associations/eager.test.ts` (line ~440–2695)
- Rails reference: `vendor/rails/activerecord/test/cases/associations/eager_test.rb`

Setup at the describe level after Wave A:

- `setupHandlerSuite()` + `useHandlerTransactionalFixtures()` for transactions
- `useFixtures([...canonical fixtures...], () => Base.connection, { schema: canonicalSchema })` for seeded data
- `defineSchema(TEST_SCHEMA)` in `beforeAll` for bespoke tables (still needed by remaining tests)

Remaining bespoke tests in EagerAssociationTest (~lines 437–2695) use inline `class Eager*`
models with bespoke schema tables. Each should be converted to canonical Post/Comment/Author/
Company/Account/etc. with real fixture data. Particular care needed for:

- Tests that create posts with explicit IDs (conflict with canonical post fixtures) — convert to
  use fixture data directly instead of `Post.create({ id: N })`.
- Tests using Person that check exact count assertions — seed people fixtures and adjust to filter
  by test-created IDs.
- `with ordering`: revert from bespoke EagerOrderPost to canonical Post (all 11 posts in DESC order)

Also covers the defineSchema blocks in the later describe blocks (lines ~2696–4970):

- Many of those `describe(...)` blocks already use `useHandlerFixtures`, but the `defineSchema(TEST_SCHEMA)`
  in the top-level `beforeAll` is still called; removing it requires all bespoke tables to be gone.

## Acceptance criteria

- All remaining bespoke `class Eager*` model+schema patterns in EagerAssociationTest converted to
  canonical models + fixture data
- `defineSchema(TEST_SCHEMA)` call removed from `beforeAll` in EagerAssociationTest
- `TEST_SCHEMA` constant removed if no other describe blocks in the file use it
- File removed from `eslint/require-canonical-schema-exclude.json` if no `defineSchema` calls remain
- All tests pass (202 total, same skip count or fewer)
- LOC ≤ 500 per PR; multiple waves if needed
