---
title: "persistence-test-canonical-wave7"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T18:30:42Z"
assignee: "persistence-test-canonical-wave7"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave6` (PR #3817), which deleted the
invented `defineSchema({ posts, animals, dogs })` block (was line ~2456) in
`packages/activerecord/src/persistence.test.ts` and strengthened the canonical
`becomes` test to mirror Rails' `test_becomes` (`topics(:first).becomes(Reply)`).

`persistence.test.ts` still contains MANY bespoke inline-class +
`defineSchema(...)` describe blocks (audit against
`vendor/rails/activerecord/test/cases/persistence_test.rb`). Remaining bespoke
`defineSchema` blocks live around lines 407, 479, 643, 891, 1040, 2132, 2253,
2304, 2332, 2374, 2398, 2433, 2456 (the invented `User` block), 2833+ (Article/
Validated/Required/Tracked to EOF), 3024, 3104, 3167, 3280, 3380, 3486, 3563,
4183 (line numbers shift as blocks convert — re-audit).

Carry-forward constraints (wave3–6): import canonical models under alias until
ALL blocks convert (top-level `Post`/`Topic`/`Item` bindings make esbuild rename
bespoke in-function classes -> wrong table); canonical `posts` has no
`created_at`/`updated_at`, `topics` no `replied_at`/`body`, `users` no
`name`/`email`/`age`; fixtures are loaded so rewrite absolute counts
fixture-aware; `.changed` is a boolean.

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
