---
title: "assoc-associations-test-wave6-delete-rails-guided-describes"
status: claimed
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-16T16:38:30Z"
assignee: "assoc-associations-test-wave6-delete-rails-guided-describes"
blocked-by: null
---

## Context

Continuation of the `associations.test.ts` grab-bag burndown (RFC 0019).
Wave 5 (PR predecessor) deleted the trails-invented `Rails-guided: association
features` describe and the two `Associations (Rails-guided)` describes (467
deletions — the remaining Rails-guided describes did not fit the 500 LOC
ceiling).

The following trails-invented duplicate describes in
`packages/activerecord/src/associations.test.ts` remain and should be deleted —
they re-cover dedicated `associations/*.test.ts` ports under non-Rails
`*(Rails-guided)*` names, using bespoke `defineSchema` tables and invented test
names:

- `Polymorphic Associations (Rails-guided)`
- `HABTM (Rails-guided)`
- `inverse_of (Rails-guided)`
- `Association Scopes (Rails-guided)`

The dedicated ports (associations/has-and-belongs-to-many-associations.test.ts,
associations/inverse-associations.test.ts, polymorphic, association-scopes)
already provide the Rails matches; wave 5 confirmed test:compare delta is zero
when deleting the sibling Rails-guided describes.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: dedicated ports under `vendor/rails/activerecord/test/cases/associations/*_test.rb`

## Acceptance criteria

- [ ] Delete each remaining `*(Rails-guided)*` duplicate describe after
      confirming via `test:compare` the dedicated port already provides the
      Rails matches.
- [ ] Fix any registry/schema leak each deletion exposes; surviving describes
      self-sufficient. Drop now-unused imports.
- [ ] `test:compare` delta non-negative; `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
- [ ] Do NOT remove the file from `eslint/require-canonical-schema-exclude.json`.
