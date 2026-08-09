---
title: "MigrationContext defaults its collaborators in the constructor, not on first read"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6272
claim: "2026-08-09T01:45:47Z"
assignee: "date-to-date-seat-raises-on-julian-only-spellings"
blocked-by: null
closed-reason: null
---

## Context

Shipped deviation from `migration-context-collaborators-need-a-pool` (PR #6268),
documented at the call site and tracked here for convergence.

Rails defaults both collaborators **in the constructor**:

```ruby
# vendor/rails/activerecord/lib/active_record/migration.rb:1214-1218
def initialize(migrations_paths, schema_migration = nil, internal_metadata = nil)
  @migrations_paths  = migrations_paths
  @schema_migration  = schema_migration || SchemaMigration.new(connection_pool)
  @internal_metadata = internal_metadata || InternalMetadata.new(connection_pool)
end
```

with the private `connection_pool` reaching
`ActiveRecord::Tasks::DatabaseTasks.migration_connection_pool`
(`migration.rb:1365-1367`).

trails resolves the default on **first read** instead
(`packages/activerecord/src/migration.ts`, the `schemaMigration` /
`internalMetadata` getters and the private `connectionPool()`), because ~28
`new MigrationContext([paths])` sites build a connectionless context purely for
file discovery (`migrations`, `migrationFiles`, `parseMigrationFilename`). Rails
can name `connection_pool` eagerly because `DatabaseTasks` always has one by the
time a context is built; in trails the eager lookup throws at construction and
takes discovery with it. The reason is stated in a comment at the constructor.

This is a load-order/call-site gap, not a TypeScript language shortcoming, so it
is convergible — the blocker is the discovery call sites, not the language.

## Converged shape

Give the discovery-only call sites a pool (or route them through
`ConnectionPool#migrationContext`, which already has one), then move both
defaults into the constructor verbatim as `migration.rb:1214-1218` writes them
and drop the `??=` getters back to plain readers.

Related: `migration-collaborator-call-sites-pass-a-pool` did this for the
collaborator constructors; this is the same move for `MigrationContext`'s own
callers.

## Acceptance criteria

- [ ] `MigrationContext`'s constructor defaults `schemaMigration` /
      `internalMetadata` eagerly, matching `migration.rb:1214-1218` line for line.
- [ ] The `schemaMigration` / `internalMetadata` getters are plain readers
      (`attr_reader`, `migration.rb:1212`), with no lazy `??=`.
- [ ] The constructor comment explaining the lazy deviation is deleted along
      with the deviation.
- [ ] Every `new MigrationContext(...)` site still works, including the
      file-discovery-only ones; migration-context / migrator / trailties `db`
      tests keep their names and pass.
