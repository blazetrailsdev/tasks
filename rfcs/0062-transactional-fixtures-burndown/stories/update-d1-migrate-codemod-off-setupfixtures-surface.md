---
title: "Update/retire D1-migrate codemod that emits setupHandlerSuite/useHandlerTransactionalFixtures"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 0
pr: null
claim: null
assignee: null
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
fail. This tooling must be updated (emit `fixtures({...})` instead) or retired
as part of terminal removal — it is NOT covered by the caller-conversion gate
(`git grep ... 'packages/activerecord/src'`), so it slips through unnoticed.

## Acceptance criteria

- The D1-migrate codemod (`scripts/d1-migrate*.ts`) no longer emits
  `setupHandlerSuite`/`useHandlerTransactionalFixtures`; it emits the
  `fixtures({...})` surface (or the tooling is retired if obsolete).
- Codemod tests updated to match; green.
- Sequence this with / fold into `delete-setupfixtures-surface` so the surface
  removal and the codemod update land coherently.
