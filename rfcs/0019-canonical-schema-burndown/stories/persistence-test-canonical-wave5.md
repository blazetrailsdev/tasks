---
title: "persistence-test-canonical-wave5"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3814
claim: "2026-06-21T17:50:43Z"
assignee: "persistence-test-canonical-wave5"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave4`. Wave4 deleted three pure
trails-invented deviation blocks in
`packages/activerecord/src/persistence.test.ts`: the invented `User`
`isPreviouslyNewRecord` block (was line ~3617) and the two invented
`Counter`/`Feature` increment/decrement/toggle blocks (was ~3662 and ~3744),
consolidating the `increment attribute` / `decrement attribute` family onto the
canonical `Account` fixtures block at line ~59.

Remaining invented-deviation / bespoke-defineSchema blocks still in the file
(audit against `vendor/rails/activerecord/test/cases/persistence_test.rb`):

- Block ~418: bespoke `defineSchema({ counters, ... })` + inline `class Counter`.
- Block ~2557: large invented `Post`/`Animal`/`Dog` deviation block
  (`increment attribute`, `decrement attribute`, `toggle boolean attribute`,
  `becomes transforms to another class`, etc.) -- still duplicates the canonical
  `increment attribute`/`decrement attribute` names from block ~59.
- Block ~3861: invented `User` block (`createBang throws on validation failure`,
  `save destroyed object`, `delete doesnt run callbacks`, `class level delete`).
  Mixed: some names map to real Rails tests (`test_save_destroyed_object`,
  `test_delete_doesnt_run_callbacks`, `test_class_level_delete`) -- convert those
  to canonical models, delete the pure-invented rest.
- Block ~3938: invented `Article`/`Validated`/`Required`/`Tracked` block to the
  end of file.

Carry-forward constraints unchanged (see wave3/wave4): import canonical models
under alias until all blocks convert; canonical `posts` has no
`created_at`/`updated_at`, `topics` no `replied_at`/`body`, `users` no
`name`/`email`/`age`; fixtures are loaded so rewrite absolute counts
fixture-aware; `.changed` is a boolean.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations
      deleted.
- [ ] No new duplicate test names; consolidate duplicated families onto the
      canonical block.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
