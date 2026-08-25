---
title: "Migrator#with_advisory_lock adds a capability gate and currentDatabase probe Rails has not"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6178
claim: "2026-08-07T16:02:16Z"
assignee: "i18n-locale-tag-rfc4646"
blocked-by: null
closed-reason: null
---

## Context

Read while converging `Migrator`'s connection reader in PR #6121. The body of
`with_advisory_lock` still carries control flow Rails does not have.

Rails (`vendor/rails/activerecord/lib/active_record/migration.rb:1600-1613`):

```ruby
def with_advisory_lock
  lock_id = generate_migrator_advisory_lock_id

  got_lock = connection.get_advisory_lock(lock_id)
  raise ConcurrentMigrationError unless got_lock
  load_migrated # reload schema_migrations ...
  yield
ensure
  if got_lock && !connection.release_advisory_lock(lock_id)
    raise ConcurrentMigrationError.new(
      ConcurrentMigrationError::RELEASE_LOCK_FAILED_MESSAGE
    )
  end
end
```

Six lines before the `ensure`. trails' `withAdvisoryLock`
(`packages/activerecord/src/migration.ts`) adds, ahead of Rails' first line:

1. A capability gate — `!this.connection.supportsAdvisoryLocks?.() ||
!this.connection.getAdvisoryLock || !this.connection.releaseAdvisoryLock`
   returns `fn()` **unlocked**. Rails has no such arm: `use_advisory_lock?`
   (`migration.rb:1596-1598`) is the gate, and it is checked by the _caller_
   (`migrate`/`run`, `migration.rb:1447`, `1461`), never inside the lock body.
   A trails adapter that answers `false` silently runs the migration with no
   lock where Rails would have run it locked or not at all.
2. A `typeof this.connection.currentDatabase !== "function"` throw with a
   trails-invented message. Rails never probes for the method.
3. `await this._ensureSchemaTable()` before `loadMigrated()`. Rails creates the
   bookkeeping tables in `Migrator#initialize` (`migration.rb:1470-1476`); the
   JSDoc explains a TS constructor cannot await, which is a real language
   constraint — but the placement is still a deviation to record, and it may
   belong in an explicit async initializer rather than inside the lock body.

Item 3 is language-forced; items 1 and 2 are not.

## Converged shape

`withAdvisoryLock` opens with `generateMigratorAdvisoryLockId()` and
`connection.getAdvisoryLock(lockId)`, with no capability gate and no
`currentDatabase` probe — the capability question belongs to
`isUseAdvisoryLock()` at the caller, as `migration.rb:1596-1598` has it. Adapters
that cannot take an advisory lock must answer `isAdvisoryLocksEnabled()` falsey
so the caller skips the lock, rather than the lock body skipping itself.

Keep the existing error-capture shape around `fn()` — that one is forced by
`no-unsafe-finally` and is already justified at the call site.

## Acceptance criteria

- The capability gate and the `currentDatabase` probe are gone from
  `withAdvisoryLock`; callers gate on `isUseAdvisoryLock()` as Rails does.
- Any adapter relying on the removed gate answers `isAdvisoryLocksEnabled()`
  correctly instead.
- `_ensureSchemaTable`'s placement is either moved to an initializer or
  documented with a `@noRailsEquivalent`-grade reason naming the constructor
  constraint.
- Advisory-lock suites green on PG and MariaDB (they skip on SQLite).
