---
title: "assoc-associations-test-wave4-convert-canonical"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3566
claim: "2026-06-17T19:09:51Z"
assignee: "assoc-associations-test-wave4-convert-canonical"
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave3-convert-canonical` (RFC 0019). Wave 3
converted the sharded/cpk-fixture batch of the `AssociationsTest` describe in
`packages/activerecord/src/associations.test.ts` (15 bodies: belongs_to/has_many
composite-key + query-constraints tests, ported to canonical `Sharded::*` / `Cpk::*`
models + fixtures; see PR for wave 3).

The remaining bespoke bodies in that describe still ride the inline `defineSchema`
scratch tables (`cpk_owners`/`cpk_items`/`cpk_parents`/`cpk_thru_*`/`inf_*`/`a_*`/`b_*`/`c_*`/etc.)
and must be converted onto canonical CPK models (`test-helpers/models/cpk/*`) +
fixtures. These include: assign/nullify composite FK belongs_to, setBelongsTo
infer/nullify, query-constraints-PK raises, autosave append/assign, composite
has_many_through append/nullify/delete, polymorphic-through, belongs_to explicit
CFK, cpk has_many by id attribute, and the eager/marked-for-destruction bodies at
the top of the describe.

Also remaining (separate waves): the `Associations`, `Associations: dependent`,
`eagerLoadBang`, and second `AssociationsTest` describes.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Port each remaining AssociationsTest body word-for-word from
      associations_test.rb onto canonical CPK models + fixtures; test names unchanged.
- [ ] Remove the corresponding scratch tables from the inline `defineSchema` as
      their last consumer is converted.
- [ ] Split into non-overlapping ≤500 LOC sibling PRs off main (NOT stacked).
- [ ] FINAL wave only: drop `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json`; `test:compare` delta non-negative;
      `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
