---
title: "assoc-associations-test-wave3-delete-dup-describes"
status: in-progress
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3472
claim: "2026-06-16T16:07:56Z"
assignee: "assoc-associations-test-wave3-delete-dup-describes"
blocked-by: null
---

## Context

Wave 3 of the `associations.test.ts` grab-bag burndown (RFC 0019). Wave 1
(PR #3465) deleted `BelongsToAssociations`; wave 2 deleted `HasOneAssociations`,
`HasManyAssociations`, `HasManyThroughAssociations`. Remaining trails-invented
duplicate describes in `packages/activerecord/src/associations.test.ts` that
re-cover dedicated `associations/*.test.ts` ports with non-Rails names:

- `CollectionProxy` (trails-flavored, Rails: collection_proxy_test.rb)
- `DependentAssociations`
- `StrictLoading`
- `HasAndBelongsToManyAssociations`
- `CounterCache`
- `TouchBelongsToParents`
- `Rails-guided: association features` and the other `*(Rails-guided)*` describes

Owner decision (parent story): delete duplicate describes rather than convert.
Split into ≤500 LOC sibling PRs off main (NOT stacked). After each deletion fix
any cross-describe registry/schema leak the deletion exposes.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: dedicated ports under `vendor/rails/activerecord/test/cases/associations/*_test.rb`

## Acceptance criteria

- [x] Delete each remaining trails-invented duplicate describe after confirming
      via `test:compare` the dedicated port already provides the Rails matches.
- [x] Fix any registry/schema leak each deletion exposes; surviving describes
      self-sufficient.
- [x] `test:compare` delta non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
- [x] Do NOT remove the file from `eslint/require-canonical-schema-exclude.json`.
