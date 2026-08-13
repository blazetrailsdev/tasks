---
title: "ar-tasks-yaml-encoder-migration-proxy-args"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6474
claim: "2026-08-13T16:25:38Z"
assignee: "ar-tasks-yaml-encoder-migration-proxy-args"
blocked-by: null
closed-reason: null
---

## Context

Split out of `naming-burndown-3-ar-structural-residue` (RFC 0096 wave 3), items
4, 6 and 7 — each needs a structural change, not a rename.

1. **`packages/activerecord/src/tasks/mysql-database-tasks.ts#create` / `#drop`**
   pass `this.requireDatabaseName()` (`:305-309`, a trails-only guard that also
   falls back to `this.urlParts.database`) where Rails passes
   `db_config.database`
   (`vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:15-23`).
   Converging means `dbConfig.database` resolving a URL config the way Rails'
   `UrlConfig#database` does, so the fallback is unnecessary.
2. **`packages/activerecord/src/model-schema.ts#yamlEncoder` (`:784-786`)** passes
   the global `typeRegistry` where Rails passes the model's own
   `attribute_types`
   (`vendor/rails/activerecord/lib/active_record/model_schema.rb:446-448`).
   trails' `AttributeSetCoder` (`packages/activemodel/src/attribute-set/coder.ts:55`)
   is registry-shaped rather than `YAMLEncoder(attribute_types)`-shaped, so this
   is an activemodel-side reshape. Check whether models with declared attribute
   overrides currently round-trip through the wrong type — likely a real bug.
3. **`packages/activerecord/src/migration.ts#executeMigrationInTransaction`
   (`:2543-2574`)** passes the async-resolved `loaded` migration to
   `ddlTransaction`, where Rails passes the `MigrationProxy` straight through
   (`vendor/rails/activerecord/lib/active_record/migration.rb:1529-1543`; the
   proxy delegates `migrate` / `disable_ddl_transaction` via `method_missing`).
   TS cannot delegate synchronously through an async load, so converging means
   either giving `MigrationProxy` the delegating members or documenting the
   shortcoming at the call site.

## Acceptance criteria

- [ ] Each of the three converges, or carries a call-site justification naming
      the specific TypeScript shortcoming.
- [ ] No baseline row added or widened.
- [ ] Touched packages' tests pass on all three adapters.
