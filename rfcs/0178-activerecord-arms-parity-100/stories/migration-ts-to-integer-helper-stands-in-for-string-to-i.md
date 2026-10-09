---
title: "migration.ts toInteger helper stands in for String#to_i, which ruby-compat ports as toI"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seen on trails#8712. `packages/activerecord/src/migration.ts` carries a module-private
`toInteger(value: string): number` (a `/^\s*(-?\d+)/` match, `0` when it misses) and calls it wherever Rails
calls `String#to_i`: `Migration.copy` (`migration.rb:1101` `next_migration_number(…).to_i`),
`MigrationContext#migrations` (`migration.rb:1480` `version = version.to_i`) and `#migrationsStatus`
(`migration.rb:1336` `version.to_i`). ruby-compat already ports `rb_str_to_i` as `toI`, which the same file
imports. The helper is an abstraction Rails does not have, and its regex is a second, narrower `to_i`
(no underscores, no radix prefix handling).

## Acceptance criteria

- [ ] `toInteger` is deleted from `migration.ts` and each call site calls `toI` (wrapped in `Number(…)` only
      where the value must be a JS number, as the neighbouring code does).
- [ ] The migration test files (`migration.test.ts`, `migrator.test.ts`, `migration-context.trails.test.ts`)
      pass unchanged.
