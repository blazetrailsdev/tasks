---
title: "Drop the per-migration internalMetadata environment write from _runMigration"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 80
pr: 6122
claim: "2026-08-05T09:45:03Z"
assignee: "retire-module-level-find-target-engine-exports"
blocked-by: null
closed-reason: null
---

## Context

`Migrator#_runMigration` (`packages/activerecord/src/migration.ts`, inside the
`_ddlTransaction` block) writes the environment on **every executed migration**:

```ts
await this.recordVersionStateAfterMigrating(proxy.version, direction);
if (direction === "up" && this._internalMetadata.enabled) {
  await this._internalMetadata.set("environment", this._environment);
}
```

Rails' `execute_migration_in_transaction`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1528-1537`) does
**only** `migration.migrate(@direction)` +
`record_version_state_after_migrating(migration.version)` — no metadata write.
Rails stamps the environment exactly once per run, before the migration loop, in
`record_environment` (migration.rb:1508-1512):

```ruby
def record_environment
  return if down?
  @internal_metadata[:environment] = connection.pool.db_config.env_name
end
```

trails already has a faithful `recordEnvironment()` and already calls it once per
run from both `runWithoutLock` and `migrateWithoutLock`. So the write inside
`_runMigration` is a duplicate: an N-migration run issues N redundant
`ar_internal_metadata` UPDATEs.

Surfaced during review of PR #5782 (story
`migrator-migrated-versions-memo-and-reload-under-lock`); the reviewer flagged it
as pre-existing and out of scope for that PR, which only moved the write
alongside `recordVersionStateAfterMigrating` without changing its shape.

## Acceptance criteria

- `_runMigration` performs no `internalMetadata` write; it mirrors
  migration.rb:1534-1537 (`migrate` + `record_version_state_after_migrating`).
- The environment is still stamped once per run via the existing
  `recordEnvironment()` call sites.
- Existing coverage keeps passing, in particular
  `migrator.trails.test.ts` "stores environment after up migration" and
  "down does not stamp the environment".
- A test asserts the write happens once for a multi-migration run, not once per
  migration.

Note: interacts with `record-environment-reads-pool-db-config-env-name` (which
changes where the env _name_ comes from, not how often it is written) — check
its state before starting.
