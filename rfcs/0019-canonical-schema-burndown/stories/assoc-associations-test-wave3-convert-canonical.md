---
title: "associations.test.ts wave 3: convert associations_test.rb describes to canonical schema (RFC 0019)"
status: ready
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up wave of `assoc-associations-test` (RFC 0019). After the duplicate
describes are deleted (wave 2), the describes that genuinely map to
`associations_test.rb` remain and must be CONVERTED onto the canonical schema
(not deleted): primarily the `AssociationsTest` describe at
`packages/activerecord/src/associations.test.ts` (~line 1919) and the
`Associations` / `Associations: dependent` / `eagerLoadBang` blocks.

`AssociationsTest` carries a very large inline `defineSchema` of CPK and
`a_*/b_*/c_*` scratch tables (~hundreds of LOC). Converting it requires mapping
each scratch table onto the canonical CPK/association tables (or the official
`test-helpers/models/cpk/*` + `sharded/*` models) and wiring fixtures via
`setupHandlerSuite()` + `useHandlerFixtures([...])`, porting bodies word-for-word
from `associations_test.rb`.

- trails: `packages/activerecord/src/associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`

## Acceptance criteria

- [ ] Open `associations_test.rb` first; port each kept body word-for-word
      (same assertions, order, control structure). Test names unchanged.
- [ ] Replace inline `defineSchema` + bespoke classes with canonical
      `test-helpers/models/*` (incl. `cpk/*`, `sharded/*`) and `useHandlerFixtures`.
      Add a column to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check); otherwise a single scoped file-unique `defineSchema` + teardown (never a shared name).
- [ ] Split across non-overlapping ≤500 LOC sibling PRs off main (NOT stacked);
      register additional waves with `pnpm tasks new` rather than fanning out.
- [ ] FINAL wave only: remove `associations.test.ts` from
      `eslint/require-canonical-schema-exclude.json` once the whole file
      lint-passes with no `eslint-disable`; `test:compare` delta non-negative;
      `pnpm vitest run packages/activerecord/src/associations.test.ts` passes.
