---
title: "associations.test.ts wave 2: delete remaining duplicate describes (RFC 0019)"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-06-16T15:46:16Z"
assignee: "assoc-associations-test-wave2-delete-dup-describes"
blocked-by: null
---

## Context

Follow-up wave of `assoc-associations-test` (RFC 0019). First wave (PR #3465)
deleted the `BelongsToAssociations` describe from
`packages/activerecord/src/associations.test.ts` because it duplicated the
dedicated `associations/belongs-to-associations.test.ts` port with
trails-invented test names (no Rails counterpart, no `test:compare` coverage).

The same grab-bag file holds more describes that DUPLICATE dedicated
`associations/*.test.ts` ports and use non-Rails names:
`HasOneAssociations`, `HasManyAssociations`, `HasManyThroughAssociations`,
`HasAndBelongsToManyAssociations`, plus the trails-flavored `CollectionProxy`,
`DependentAssociations`, `StrictLoading`, `CounterCache`, `TouchBelongsToParents`,
and `*Rails-guided*` describes. Owner decision (recorded on the parent story):
delete duplicate describes rather than convert.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (the file
  this grab-bag nominally maps to); dedicated ports live under
  `vendor/rails/activerecord/test/cases/associations/*_test.rb`.

## Acceptance criteria

- [ ] For each describe in `associations.test.ts` that duplicates a dedicated
      `associations/*.test.ts` port, confirm via `test:compare` that the
      dedicated file already provides the Rails matches, then DELETE the
      duplicate describe. Keep non-overlapping ≤500 LOC per PR; split across
      sibling PRs off main (NOT stacked).
- [ ] After each deletion, fix any cross-describe registry/schema leak the
      deletion exposes (e.g. `registerModel` a describe relied on leaking from a
      neighbor) — make each surviving describe self-sufficient.
- [ ] `test:compare` delta non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
- [ ] Do NOT remove the file from `eslint/require-canonical-schema-exclude.json`
      (that happens only in the final canonical-conversion wave).
