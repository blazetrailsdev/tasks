---
title: "Migrator#rollback/#forward diverge from Rails' move for their live callers"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 130
pr: 6120
claim: "2026-08-05T09:14:57Z"
assignee: "relocate-erb-util-ports-to-core-ext-tse-util"
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#rollback` / `#forward` were fixed in PR #5820 to call
`move("down"/"up", steps)`, matching Rails
(`vendor/rails/activerecord/lib/active_record/migration.rb:1240-1246`).

`Migrator` still carries its own bespoke `rollback` / `forward`
(`packages/activerecord/src/migration.ts`, the `MigrationContext-style` block),
and Rails' `Migrator` (`migration.rb:1404+`) has no such methods at all. Their
live callers — `packages/activerecord/src/tasks/database-tasks.ts`,
`packages/trailties/src/commands/db.ts` — still get the divergent behavior:

- `Migrator#rollback` walks the last N _applied_ versions, reversed, and runs
  them down. Rails' `move` indexes into the sorted migration list starting from
  `currentMigration`, so when migrations were applied out of order the two pick
  a **different set** to roll back.
- `Migrator#rollback` never raises `UnknownMigrationVersionError` when the
  current version has no matching migration; Rails' `move` does
  (`migration.rb:1390-1392`). PR #5820 pinned this for `MigrationContext` in
  `migration-context.trails.test.ts` ("rollback goes through move, not
  Migrator's applied-version walk"); the `Migrator` path is unpinned.

This is distinct from `migrator-keeps-only-its-rails-1404-surface`, which
deletes the parallel copies: the point here is that the _callers_ must land on
`move` semantics rather than have the divergence silently deleted along with the
methods, and that the out-of-order case needs a regression test.

## Acceptance criteria

- [ ] `database-tasks.ts` and trailties' `db.ts` rollback/forward paths get
      `move`'s selection and its `UnknownMigrationVersionError`.
- [ ] A regression test covers rolling back when migrations were applied out of
      order, showing `move`'s set differs from the applied-version walk.
- [ ] Test names match Rails verbatim where an upstream test exists.
