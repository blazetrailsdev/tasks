---
title: "persistence-test-canonical-wave6"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T18:14:41Z"
assignee: "persistence-test-canonical-wave6"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave5`. Wave5 converted the bespoke
`defineSchema({ topics, counters })` block (was line ~418) in
`packages/activerecord/src/persistence.test.ts` to canonical models + fixtures:
the five tests (`raises error when validations failed`,
`class level update is affected by scoping`, `save touch false`,
`increment with no arg`, `reload removes custom selects`) now ride canonical
`Developer`/`Topic`/`Parrot`/`Post` and the loaded fixtures. As part of that
convergence, `increment!` now raises on a missing attribute (Rails' ArgumentError
on a bare `increment!`) -- see `persistence.ts` `incrementBang`.

`persistence.test.ts` still contains MANY bespoke inline-class
(`class Post`/`class Topic`/`class User`/`class Counter` ...) +
`defineSchema(...)` blocks (audit against
`vendor/rails/activerecord/test/cases/persistence_test.rb`). Next coherent
slices to convert (each <=500 LOC, one PR each):

- Block ~2557: large invented `Post`/`Animal`/`Dog` deviation block
  (`increment attribute`, `decrement attribute`, `toggle boolean attribute`,
  `becomes transforms to another class`, etc.) -- consolidate the duplicated
  `increment attribute`/`decrement attribute` family onto the canonical
  `Account` block at line ~59; port `becomes*` to the canonical Rails tests.
- Block ~3861: invented `User` block -- convert the real Rails tests
  (`test_save_destroyed_object`, `test_delete_doesnt_run_callbacks`,
  `test_class_level_delete`) to canonical models; delete the pure-invented rest.
- Block ~3938: invented `Article`/`Validated`/`Required`/`Tracked` block to EOF.
- Numerous other bespoke `defineSchema` describe blocks throughout (490, 654,
  902, 1051, 2143, 2233, 2354, 2429, 2475, 2499, 2534, 2934, 3125, 3235, 3298,
  3411, 3511, 3617, 3662, 3744, 4558, ...).

Carry-forward constraints unchanged (wave3/wave4/wave5): import canonical
models under alias until ALL blocks convert (top-level `Post`/`Topic`/`Item`
bindings make esbuild rename the bespoke in-function classes -> wrong table);
canonical `posts` has no `created_at`/`updated_at`, `topics` no
`replied_at`/`body`, `users` no `name`/`email`/`age`; fixtures are loaded so
rewrite absolute counts fixture-aware; `.changed` is a boolean.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names; consolidate duplicated families onto the
      canonical block.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
