---
title: "generate_migrator_advisory_lock_id carries a currentDatabase probe and an empty-name salt fallback Rails has not"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6239
claim: "2026-08-08T15:16:01Z"
assignee: "generate-migrator-advisory-lock-id-probes-and-falls-back"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migrator#generate_migrator_advisory_lock_id`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1616-1619`) is three
lines with no guards:

```ruby
MIGRATOR_SALT = 2053462845
def generate_migrator_advisory_lock_id
  db_name_hash = Zlib.crc32(connection.current_database)
  MIGRATOR_SALT * db_name_hash
end
```

trails' `generateMigratorAdvisoryLockId`
(`packages/activerecord/src/migration.ts`) adds two arms Rails does not have:

1. A `typeof this.connection.currentDatabase !== "function"` throw carrying a
   trails-invented message,
   `"<Adapter> must implement currentDatabase() to support advisory-locked
migrations"`. Rails never probes for the method — a connection that lacks it
   raises `NoMethodError`, which is the correct failure.
2. An empty-`currentDatabase()` fallback that returns the **bare salt**, with a
   comment naming the MySQL stub as the reason. Rails would hash `""`
   (`Zlib.crc32("")` is `0`) and answer `0`. Silently answering a different lock
   id means two databases can share a lock, or fail to.

`with-advisory-lock-carries-guards-rails-lacks` (PR #6178) removed the same two
guards from `withAdvisoryLock` and left these, because the story scoped to that
method. `isUseAdvisoryLock`'s JSDoc currently points at this method as the place
the `currentDatabase` requirement is enforced, so it needs updating too.

## Converged shape

```ts
async generateMigratorAdvisoryLockId(): Promise<bigint> {
  const dbNameHash = _crc32(await this.connection.currentDatabase());
  return BigInt(Migrator._MIGRATOR_SALT) * BigInt(dbNameHash);
}
```

No probe, no empty-string arm. An adapter that cannot answer `currentDatabase()`
fails the way Rails fails. If the MySQL stub really does return `""`, that is
the adapter's bug and belongs in the adapter — file it separately rather than
compensating here.

## Acceptance criteria

- [ ] The `typeof ... !== "function"` throw and the empty-name fallback are gone.
- [ ] `isUseAdvisoryLock`'s JSDoc no longer cites this method as the enforcement
      point.
- [ ] Any adapter that was relying on the fallback answers `currentDatabase()`
      correctly instead, or is filed as its own story.
- [ ] Advisory-lock suites green on PG and MariaDB (they skip on SQLite).
