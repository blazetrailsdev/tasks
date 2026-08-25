---
title: "persistence-test-canonical-wave4"
status: done
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3812
claim: "2026-06-21T17:34:43Z"
assignee: "persistence-test-canonical-wave4"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave3`. Wave3 reframed the campaign:
the remaining `describe("PersistenceTest")` blocks in
`packages/activerecord/src/persistence.test.ts` are NOT a mechanical
"defineSchema -> canonical" port. Audit against
`vendor/rails/activerecord/test/cases/persistence_test.rb` (161 real tests vs
~377 trails `it()`s) shows the file is a mix of:

1. **Real Rails ports implemented on bespoke `defineSchema` + inline classes**
   (e.g. block ~30: "delete all", "increment attribute", "update attribute") --
   these must be CONVERTED to the canonical models (`Topic`, `Post`,
   `Developer`, `Minivan`, `ClothingItem`) + `useHandlerFixtures` + fixtures,
   matching Rails bodies, names verbatim.
2. **Pure trails-invented deviation tests** (invented `User`/`Required`/
   `Tracked`/`Counter`/`Feature` classes, snake_case invented names like
   "update_column persists to the database", duplicate test names across
   blocks) -- per RFC 0019 fidelity-first these must be DELETED, not ported.

Wave3 did one bounded slice: converted the `update_column`/`update_columns`
block (was line ~3241) to canonical `Topic` + topics fixtures with real Rails
bodies; deleted a pure-deviation `User` block (was ~2233) and two duplicate
deviation `it()`s in block ~30. See that PR for the established pattern
(import `Topic as CanonicalTopic`, `useHandlerFixtures(["topics"], { schema:
canonicalSchema })`, `const Topic = CanonicalTopic` per block).

Carry-forward constraints (from wave2/wave3):

- Import canonical `Topic` UNDER ALIAS until ALL blocks convert (top-level
  `Topic` makes esbuild rename bespoke inline `class Topic` -> `Topic2` ->
  missing `topic2s` table).
- Canonical `posts` has NO `created_at`/`updated_at`; `topics` has NO
  `replied_at`/`body`; `users` has NO `name`/`email`/`age`. Blocks needing
  those map to the real Rails model/columns (add to canonical TEST_SCHEMA
  mirroring schema.rb only if genuinely missing) or stay for a later wave.
- Fixtures are loaded; rewrite absolute-count assertions fixture-aware.
- `.changed` is a boolean in trails (Rails `changed` array -> assert `false`).

## Acceptance criteria

- [ ] Convert/delete the next coherent slice of `PersistenceTest` blocks per
      the audit above (one PR, <=500 LOC). Real Rails tests -> canonical
      models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names; consolidate duplicated families onto the
      canonical block.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
