---
title: "activerecord-cli --all reads the raw configurations array, bypassing configs_for filtering"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6173
claim: "2026-08-07T13:54:41Z"
assignee: "datetime-new-drops-canon24oc"
blocked-by: null
closed-reason: null
---

## Context

Rails' `db:schema:dump` and `db:structure:dump` reach every configured database
through `DatabaseTasks.for_each(databases)`, which defines one namespaced task
per config name and calls `with_temporary_pool_for_each(name: name)`
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake:464-472`).
The un-namespaced task is `with_temporary_pool_for_each` with no `name:`
(`databases.rake:449-455`).

PR #6170 converged `dbSchemaDump`
(`packages/activerecord-cli/src/db-tasks.ts:162`) onto
`DatabaseTasks.withTemporaryPoolForEach({ env }, ...)`, but the two `--all`
paths in the same file still hand-roll the config list off the registry:

- `db-tasks.ts:327` (`dbCreate`/`dbDrop` family)
- `db-tasks.ts:371` (`dbMigrate` family)

both spell it

```ts
const configs = all
  ? (DatabaseTasks.databaseConfiguration?.configurations ?? [])
  : DatabaseTasks.configsFor(env);
```

`DatabaseConfigurations#configurations` is the raw un-filtered array — it is not
what any Rails task iterates, and it bypasses `configs_for`'s `include_hidden`
filtering (`database_configurations.rb`'s `configs_for`, which defaults
`include_hidden: false` and drops `replica:`/`database_tasks: false` entries).
So `--all` currently visits configs Rails' tasks deliberately skip.

## Converged shape

Route both `--all` branches through `configsFor` / `withTemporaryPoolForEach`
rather than the raw `configurations` array, so hidden and replica configs are
filtered the way `database_tasks.rb:598-599`'s `each_local_configuration` and
`databases.rake`'s per-name tasks do. `--all` is a trails-only flag standing in
for Rails' per-name namespaced tasks; keep the flag but give it Rails'
config set.

## Acceptance criteria

- [ ] Neither `--all` branch in `db-tasks.ts` reads
      `DatabaseTasks.databaseConfiguration.configurations` directly.
- [ ] A `replica: true` / `database_tasks: false` config is skipped by `--all`,
      covered by a test.
- [ ] `activerecord-cli` suite green, including the sqlite happy-path E2E.
