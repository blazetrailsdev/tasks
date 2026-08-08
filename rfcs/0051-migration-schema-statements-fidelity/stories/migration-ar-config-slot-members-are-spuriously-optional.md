---
title: "MigrationArConfig's slot members are spuriously optional, forcing non-null assertions Rails has no counterpart for"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6247
claim: "2026-08-08T14:51:58Z"
assignee: "migration-ar-config-slot-members-are-spuriously-optional"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6216, which converged `Migration#connection` to Rails' two-arm
`@connection || DatabaseTasks.migration_connection`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1036-1038`).

The converged body reads:

```ts
return this._connectionOverride ?? migrationArConfig()!.databaseTasks!().migrationConnection();
```

Two non-null assertions for what Rails spells as a bare constant reference.
They are forced by the slot's own type, not by anything real:
`MigrationArConfig` (`packages/activerecord/src/migration/ar-config-source.ts`)
declares `databaseTasks?`, `configurations?` and `connectionHandler?` as
OPTIONAL members, and `migrationArConfig()` returns `MigrationArConfig | null`.

But `base.ts` registers the config exactly once, at module init, with all three
members present and unconditional. There is no registration path that omits
any of them, so the optionality is unreachable — it only makes every reader in
`migration.ts` carry `!` or a `?.` fallback that Rails does not have, and it
lets a genuinely-missing registration surface as a TypeError at an arbitrary
call site rather than at wiring time.

## Converged shape

Make the three members required on `MigrationArConfig`, so the slot's type says
what the registration already guarantees. `migrationArConfig()` keeps its
nullable return (the pre-registration window is real), but the per-member `!`
in `migration.ts` — `migrationArConfig()!.databaseTasks!()` and the
`migrationArConfig()?.configurations?.()` chains at :1473-1474, :1588-1589,
:1737, :1762, :1793-1799 — collapse to one assertion at the slot read.

Cross-check each `?.`-with-fallback reader while converging: several spell a
`?? ""` / `?? []` default that stands in for "config not registered", which is
a branch Rails has no counterpart for and which should go with the optionality
rather than being preserved.

## Acceptance criteria

- [ ] `MigrationArConfig.databaseTasks` / `.configurations` / `.connectionHandler`
      are required members.
- [ ] `migration.ts` readers carry at most one `!` (the slot read), no per-member
      assertion.
- [ ] No `?? ""` / `?? []` fallback survives that only existed to cover an
      unregistered member.
- [ ] `pnpm typecheck`, migration + migrator suites green.
