---
title: "assoc-associations-test-wave4-delete-dup-describes"
status: done
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3474
claim: "2026-06-16T16:18:33Z"
assignee: "assoc-associations-test-wave4-delete-dup-describes"
blocked-by: null
---

## Context

Continuation of the `associations.test.ts` grab-bag burndown (RFC 0019).
Wave 3 (PR #3472) deleted the trails-invented `CollectionProxy` and
`DependentAssociations` duplicate describes (488 deletions — the remainder did
not fit the 500 LOC ceiling). The following trails-invented duplicate describes
in `packages/activerecord/src/associations.test.ts` still re-cover dedicated
`associations/*.test.ts` ports with non-Rails names and should be deleted:

- `StrictLoading` (Rails: strict_loading_test.rb)
- `HasAndBelongsToManyAssociations` (port: associations/has-and-belongs-to-many-associations.test.ts)
- `CounterCache`
- `TouchBelongsToParents`
- `Rails-guided: association features` and the other `*(Rails-guided)*` describes
  (Associations / Polymorphic / HABTM / inverse_of / Association Scopes)

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: dedicated ports under `vendor/rails/activerecord/test/cases/associations/*_test.rb`

## Acceptance criteria

- [ ] Delete each remaining trails-invented duplicate describe after confirming
      via `test:compare` the dedicated port already provides the Rails matches.
- [ ] Fix any registry/schema leak each deletion exposes; surviving describes
      self-sufficient.
- [ ] `test:compare` delta non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
- [ ] Do NOT remove the file from `eslint/require-canonical-schema-exclude.json`.
- [ ] Split into ≤500 LOC sibling PRs off main (NOT stacked) if needed.
