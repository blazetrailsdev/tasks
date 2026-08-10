---
title: "Migrator still carries up/down/rollback/forward, which Rails' Migrator has not"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6239
claim: "2026-08-08T15:16:01Z"
assignee: "generate-migrator-advisory-lock-id-probes-and-falls-back"
blocked-by: null
closed-reason: null
---

## Context

`migrator-keeps-only-its-rails-1404-surface` is marked `done` (PR #5845), but
`Migrator` still carries four methods Rails' `Migrator` does not have. Rails'
only locked entry points are `#run` (`migration.rb:1444-1450`) and `#migrate`
(`migration.rb:1452-1458`); `rollback` / `forward` live on `MigrationContext`
and delegate to `move` (`migration.rb:1240-1246`), and there is no `Migrator#up`
or `Migrator#down` at all.

trails' `packages/activerecord/src/migration.ts` `Migrator` has all four:

- `Migrator#up` and `Migrator#down` — each builds a nested `new Migrator(...)`
  and calls `migrateWithoutLock`, duplicating `MigrationContext#up` / `#down`
  (which already exist at `migration.ts` `class MigrationContext`).
- `Migrator#rollback` and `Migrator#forward` — the applied-version walk that
  `migrator-rollback-forward-diverge-from-move` documented as picking a
  different set than `move` when migrations ran out of order.

Surfaced while gating all four on `isUseAdvisoryLock()` in PR #6178: the story
required "callers gate as Rails does", which meant putting a Rails-shaped gate
around four methods Rails does not have — each now carries an
`isUseAdvisoryLock() ? withAdvisoryLock(body) : body()` block, and the two
step-wise ones needed a `body` closure to express it.

## Converged shape

`Migrator` keeps only its `migration.rb:1404+` surface. The four methods are
deleted and their callers land on `MigrationContext#up` / `#down` / `#rollback`
/ `#forward`, which already have the Rails semantics. The advisory-lock gate
then exists at exactly the two places Rails has it, and the two `body` closures
go away with the methods.

Check the live callers first — `packages/activerecord/src/tasks/database-tasks.ts`
and `packages/trailties/src/commands/db.ts` were the ones
`migrator-rollback-forward-diverge-from-move` named.

## Acceptance criteria

- [ ] `Migrator#up`, `#down`, `#rollback` and `#forward` are gone.
- [ ] No caller regresses; each lands on the `MigrationContext` method.
- [ ] `pnpm parity:api:extra --package activerecord` drops the four names.
- [ ] The `body` closures added in PR #6178 are gone with them.
