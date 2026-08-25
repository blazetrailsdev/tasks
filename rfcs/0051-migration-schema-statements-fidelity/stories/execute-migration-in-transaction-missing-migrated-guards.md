---
title: "Port the migrated? early-return guards into executeMigrationInTransaction"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5843
claim: "2026-08-02T00:16:03Z"
assignee: "execute-migration-in-transaction-missing-migrated-guards"
blocked-by: null
closed-reason: null
---

## Context

Rails' `execute_migration_in_transaction` opens with two early-return guards
(`vendor/rails/activerecord/lib/active_record/migration.rb:1528-1530`):

```ruby
def execute_migration_in_transaction(migration)
  return if down? && !migrated.include?(migration.version.to_i)
  return if up?   &&  migrated.include?(migration.version.to_i)
  ...
```

trails' `executeMigrationInTransaction` (`packages/activerecord/src/migration.ts`,
~line 2517) has neither: it goes straight to `_runMigration(proxy, this._direction)`.
The gap predates PR #5809 (it was there under the old default-`direction` signature
too) and is currently masked, because the only caller — `migrateWithoutLock` — runs
`runnable()`, which pre-filters to exactly the set the guards would let through.
`runWithoutLock` carries its own equivalent guards inline instead
(migration.ts:2444-2445, with a comment saying so).

So the guard logic exists in trails twice, in the wrong places, and not at all in
the method Rails puts it in. Any future caller of `executeMigrationInTransaction`
that does not pre-filter would re-run or re-revert applied migrations.

## Acceptance criteria

- `executeMigrationInTransaction` carries both early-return guards, matching
  migration.rb:1528-1530.
- The duplicated inline guards in `runWithoutLock` are removed if routing that
  path through `executeMigrationInTransaction` is what Rails' `run` does
  (migration.rb:1494-1499 calls `execute_migration_in_transaction(migration)`);
  otherwise justify the remainder at the call site.
- No behaviour change for `migrateWithoutLock` (the guards are redundant there
  after `runnable()` pre-filtering) — existing `migrator.test.ts` cases pass
  unchanged, names untouched.
