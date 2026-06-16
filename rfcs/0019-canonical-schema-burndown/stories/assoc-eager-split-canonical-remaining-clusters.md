---
title: "eager.test.ts → canonical schema: remaining bespoke clusters (multi-PR)"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-06-16T16:23:30Z"
assignee: "assoc-eager-split-canonical-remaining-clusters"
blocked-by: null
---

## Context

Umbrella story `assoc-eager-split-canonical` (RFC 0019) shipped wave 1 (the
`Comment.includes(:post)` belongs_to limit/conditions cluster, PR #3458) and
registered the next belongs_to wave as `assoc-eager-split-canonical-belongsto-wave2`.

`packages/activerecord/src/associations/eager.test.ts` still has a large bespoke
`describe("EagerAssociationTest")` block (top of file) that declares ad-hoc
per-test models against an inline `TEST_SCHEMA` (~300 inline tables) plus a
single `beforeAll(defineSchema(TEST_SCHEMA))`. These remaining clusters still
need converging onto canonical registry models + fixtures, ported word-for-word
from Rails `activerecord/test/cases/associations/eager_test.rb`:

- has_many-through (`eager with has many through *`, join-model conditions/include).
- has_many + limit/offset/conditions (`eager with has many and limit *`).
- default-scope (`eager with default scope *`).
- inheritance / STI (`eager with inheritance`, `eager has * with association inheritance`).
- habtm (`eager association loading with habtm *`, `eager with has and belongs to many and limit`).
- nested loading through has_one (`nested loading through has one association *`).
- preloading clusters (`preloading has many through *`, instance-dependent, scoping).
- misc (`polymorphic type condition`, `eager with floating point numbers`,
  `preconfigured includes with *`, quotes table/column names).

This is multi-PR: split per-cluster across sibling PRs off `main` (non-overlapping,
NOT stacked), each ≤300 LOC, and register each remaining cluster as its own draft
story. The file stays in the require-canonical-schema exclude list until the
final wave removes the last `defineSchema`; only then drop its exclude entry.

## Acceptance criteria

- [ ] Open `eager_test.rb` first; port each body word-for-word, test names unchanged.
- [ ] Replace bespoke per-test models with canonical registry models
      (Author/Post/Comment/Tag/Category/Firm + their Rails associations); rows via
      `useHandlerFixtures` + `name(:label)`.
- [ ] Remove the bespoke inline `TEST_SCHEMA` entries for each converted cluster;
      add a canonical column to `test-helpers/test-schema.ts` ONLY when Rails
      `schema.rb` has it (parity-check first).
- [ ] `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/eager.test.ts` passes.
- [ ] Each PR ≤300 LOC, single PR from main, not stacked. File remaining clusters
      as new draft stories rather than fanning out.
