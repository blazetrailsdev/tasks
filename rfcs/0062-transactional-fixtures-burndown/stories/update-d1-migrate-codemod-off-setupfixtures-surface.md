---
title: "Retire the D1-migrate codemod (emits setupHandlerSuite/useHandlerTransactionalFixtures)"
status: claimed
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 0
pr: null
claim: "2026-07-05T20:02:00Z"
assignee: "update-d1-migrate-codemod-off-setupfixtures-surface"
blocked-by: null
closed-reason: null
---

## Context

PR #4627 drove the deprecated `setupFixtures` / `useHandlerTransactionalFixtures`
surface to zero _test-file_ callers under `packages/activerecord/src`. But the
D1-migration codemod tooling still **emits** that surface into generated files,
and its tests assert on the emitted strings:

- `scripts/d1-migrate-multi-describe.ts:511-523` inserts
  `setupHandlerSuite() + useHandlerTransactionalFixtures()` and pushes the
  detail string `"inserted setupHandlerSuite + useHandlerTransactionalFixtures"`.
- `scripts/d1-migrate.test.ts:98,148,181`, `scripts/d1-migrate-pg-mysql.test.ts:48,87`,
  `scripts/d1-migrate-multi-describe.test.ts:91` all `expect(...).toContain("useHandlerTransactionalFixtures()")`
  (or `.not.toContain`).

When `delete-setupfixtures-surface` removes the exports, these scripts will
generate code that imports a non-existent symbol, and the codemod tests will
fail. This tooling is NOT covered by the caller-conversion gate
(`git grep ... 'packages/activerecord/src'`), so it slips through unnoticed.

**Resolution is deletion, not migration.** The D1-migrate codemod has done its
job — the one-time migration is complete and `fixtures({...})` is the sole
authored surface, so we no longer need this codemod at all. **Retire it: delete
the codemod scripts and their tests.** Do NOT invest in teaching it to emit the
new `fixtures({...})` surface — a one-shot migration tool we won't run again is
not worth carrying.

## Acceptance criteria

- The D1-migrate codemod (`scripts/d1-migrate*.ts`) and its tests
  (`scripts/d1-migrate*.test.ts`) are **deleted**, not rewritten — no code
  emits `setupHandlerSuite`/`useHandlerTransactionalFixtures` anymore.
- No dangling references to the removed scripts (package.json scripts, imports,
  docs); repo builds and lints clean.
- Sequence this with / fold into `delete-setupfixtures-surface` so the surface
  removal and the codemod retirement land coherently.
