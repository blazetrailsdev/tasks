---
title: "Migration.verbose should be a class attribute, not per-instance + Migrator.verbose"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `verbose` is a `cattr_accessor` on `ActiveRecord::Migration`
(`vendor/rails/activerecord/lib/active_record/migration.rb:797`, defaulted to
`true` at `:811`), read by `Migration#write`
(`migration.rb:1002` — `puts(text) if verbose`) and toggled wholesale by
`suppress_messages` (`migration.rb:1030-1033`). There is exactly one knob, and
it is class-level: `ActiveRecord::Migration.verbose = false`.

trails has no `Migration.verbose` class attribute. Instead there are two
unrelated instance fields:

- `Migration#verbose` (`packages/activerecord/src/migration.ts:302`), and
- `Migrator#verbose` (`packages/activerecord/src/migration.ts:2061`), a trails
  invention — Rails' `Migrator` has no `verbose` at all.

Discovered while porting `Migration#write` to the stdout shim (PR #5481,
story `migration-write-uses-logger-not-puts`). That PR routed both banner emit
sites through the single `write` gate, but could not converge the knob itself
without touching every caller, so the duplication remains.

Consequence for test fidelity: Rails' `test_migrator_verbosity` /
`test_migrator_verbosity_off` (`vendor/rails/activerecord/test/cases/migrator_test.rb:365-386`)
set `ActiveRecord::Migration.verbose = true/false`. Our ports
(`packages/activerecord/src/migrator.test.ts`) set `upMigrator.verbose` /
`downMigrator.verbose` instead, because the class attribute does not exist —
so the tests exercise the invented knob, not the Rails one.

## Acceptance criteria

- [ ] `Migration.verbose` exists as a class-level accessor defaulting to `true`,
      matching `migration.rb:797`/`:811`.
- [ ] `Migration#write` reads it (`migration.rb:1002`) and `suppressMessages`
      toggles it (`migration.rb:1030-1033`).
- [ ] `Migrator#verbose` is removed, or justified at the call site if some
      caller genuinely needs per-run scoping that Rails lacks.
- [ ] `migrator.test.ts`'s two verbosity tests set the class attribute the way
      `migrator_test.rb:365-386` does. Test names stay verbatim.
- [ ] `DatabaseTasks`' `isVerbose()` gate and `trailties db` are updated to the
      single knob if they overlap with it.
