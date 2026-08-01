---
title: "Route Migrator#migrate_without_lock through the ported runnable and delete _migrateUp/_migrateDown"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5809
claim: "2026-08-01T18:21:00Z"
assignee: "route-migrate-without-lock-through-runnable"
blocked-by: null
closed-reason: null
---

## Context

Rails' `migrate_without_lock` drives the whole multi-migration run through
`runnable` (`vendor/rails/activerecord/lib/active_record/migration.rb:1500-1507`):

```ruby
def migrate_without_lock
  if invalid_target?
    raise UnknownMigrationVersionError.new(@target_version)
  end

  record_environment
  runnable.each(&method(:execute_migration_in_transaction))
end
```

PR #5784 ported `Migrator#runnable` faithfully (the `migrations[start..finish]`
slice, `runnable.pop if target`, and the `ran?` polarity flip between up and
down), plus the private `start` / `finish` / `target` helpers. But nothing calls
it: `migrateWithoutLock` in `packages/activerecord/src/migration.ts` still
branches to `_migrateDown` / `_migrateUp`, which hand-roll their own equivalent
filtering inline:

```ts
return this.isDown()
  ? this._migrateDown(this._targetVersion)
  : this._migrateUp(this._targetVersion);
```

So trails carries two independent implementations of the same selection logic —
the converged one (unused) and the invented one (live). That is exactly the
duplication #5784 was a prerequisite for removing, and it is a standing risk that
the two drift.

## Acceptance criteria

- `migrateWithoutLock` calls `runnable()` and runs each result through
  `executeMigrationInTransaction`, matching migration.rb:1500-1507.
- `_migrateUp` / `_migrateDown` are deleted, or reduced to whatever genuinely has
  no Rails counterpart, with any remainder justified at the call site.
- The existing ported `migrator.test.ts` cases keep passing unchanged — in
  particular `test_migrator_going_down_due_to_version_target`,
  `test_target_version_zero_should_run_only_once`, `test_migrator_one_up_one_down`,
  `test_migrator_double_down`, and `test_migrator_rollback`. Do NOT rename or
  reword them.
- Watch the return shape: `migrateWithoutLock` currently resolves to
  `MigrationProxy[]` and callers (`migrate`, `rollback`, `forward`, and the
  `migrator output when running multiple migrations` test) assert on the length,
  whereas Rails' `runnable.each` returns the runnable list. Keep the trails
  return contract or update every caller in the same PR.
- Note `runnable()` reads `migrated()` per migration via `isRan`; #5782 memoized
  `migrated`, so routing through it must not defeat that memo (it is cleared in
  `loadMigrated` under the advisory lock).
