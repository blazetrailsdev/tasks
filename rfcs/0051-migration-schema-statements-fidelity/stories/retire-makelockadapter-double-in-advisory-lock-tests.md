---
title: "Retire the makeLockAdapter test double in favour of Rails' real-connection advisory-lock tests"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 150
pr: 6121
claim: "2026-08-05T09:30:01Z"
assignee: "rename-relation-modelclass-field-to-model"
blocked-by: null
closed-reason: null
---

## Context

`makeLockAdapter` in `packages/activerecord/src/migration.test.ts:189-199` is a
trails-invented test double — a bare object literal cast to `DatabaseAdapter`
carrying only `supportsAdvisoryLocks` / `getAdvisoryLock` /
`releaseAdvisoryLock` / `currentDatabase` / `isNoDatabaseError`:

```ts
function makeLockAdapter(opts: { acquires?: boolean; releases?: boolean } = {}) {
  return { adapterName: "sqlite", supportsAdvisoryLocks: () => true, ... } as unknown as DatabaseAdapter;
}
```

Rails' advisory-lock tests use the **real** connection throughout
(`vendor/rails/activerecord/test/cases/migration_test.rb:1069-1124`), stubbing
only `get_advisory_lock` where a failed acquire must be simulated.

PR #5782 already converged the one case where the double actually broke —
"with advisory lock raises the right error when it fails to release lock" now
uses `Base.connection` and provokes the failure by releasing the lock inside the
block, matching migration_test.rb:1107-1124. Two `acquires: false` callers
remain (migration.test.ts:1408 and :1429, "migrator one up with unavailable
lock" and "... using run").

This matters beyond style: because the double has no schema surface, any
convergence that makes the advisory-lock path touch the database breaks it. That
is exactly what happened in #5782 when `_withAdvisoryLock` gained Rails'
`load_migrated` call (migration.rb:1601) — it failed with
`this._adapter.tableExists is not a function`, and only in the PG/MariaDB CI
lanes, since `itIfSupports("advisory_locks")` skips the whole cluster on SQLite.

## Acceptance criteria

- The two remaining `makeLockAdapter` callers use the real adapter
  (`Base.connection`) with `getAdvisoryLock` stubbed to return false, mirroring
  how Rails simulates an unavailable lock.
- `makeLockAdapter` is deleted once it has no callers.
- Test names are unchanged.
- Verified green on the PostgreSQL lane, not just SQLite — the cluster is gated
  on `itIfSupports("advisory_locks")` and skips entirely under SQLite.
