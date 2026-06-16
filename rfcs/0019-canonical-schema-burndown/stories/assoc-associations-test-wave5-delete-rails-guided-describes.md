---
title: "assoc-associations-test-wave5-delete-rails-guided-describes"
status: in-progress
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3479
claim: "2026-06-16T16:33:31Z"
assignee: "assoc-associations-test-wave5-delete-rails-guided-describes"
blocked-by: null
---

## Context

Continuation of the `associations.test.ts` grab-bag burndown (RFC 0019).
Wave 4 (this PR's predecessor) deleted the trails-invented `StrictLoading`,
`HasAndBelongsToManyAssociations`, `CounterCache`, and `TouchBelongsToParents`
duplicate describes (356 deletions — the remaining Rails-guided describes did
not fit the 500 LOC ceiling).

The following trails-invented duplicate describes in
`packages/activerecord/src/associations.test.ts` remain and should be deleted —
they re-cover dedicated `associations/*.test.ts` ports under non-Rails
`*(Rails-guided)*` / `Rails-guided:` names:

- `Rails-guided: association features`
- `Associations (Rails-guided)` (two describes)
- `Polymorphic Associations (Rails-guided)`
- `HABTM (Rails-guided)`
- `inverse_of (Rails-guided)`
- `Association Scopes (Rails-guided)`

These use bespoke `defineSchema` tables (articles, etc.) and invented test
names; the dedicated ports (associations/belongs-to-associations.test.ts,
associations/has-and-belongs-to-many-associations.test.ts,
associations/inverse-associations.test.ts, polymorphic, etc.) already provide
the Rails matches.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: dedicated ports under `vendor/rails/activerecord/test/cases/associations/*_test.rb`

## Acceptance criteria

- [ ] Delete each remaining `*(Rails-guided)*` / `Rails-guided:` duplicate
      describe after confirming via `test:compare` the dedicated port already
      provides the Rails matches.
- [ ] Fix any registry/schema leak each deletion exposes; surviving describes
      self-sufficient. Drop now-unused imports.
- [ ] `test:compare` delta non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
- [ ] Do NOT remove the file from `eslint/require-canonical-schema-exclude.json`.
- [ ] Split into ≤500 LOC sibling PRs off main (NOT stacked) if needed.
