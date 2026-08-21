---
title: "mysql-structure-load-pipes-stdin-instead-of-execute"
status: in-progress
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6810
claim: "2026-08-21T11:39:15Z"
assignee: "measure-adapter-specific-arm-saving-on-mariadb"
blocked-by: null
closed-reason: null
---

## Context

`MySQLDatabaseTasks#structure_load`
(`activerecord/lib/active_record/tasks/mysql_database_tasks.rb:58-65`) builds

```ruby
args.concat(["--execute", %{SET FOREIGN_KEY_CHECKS = 0; SOURCE #{filename}; SET FOREIGN_KEY_CHECKS = 1}])
args.concat(["--database", db_config.database.to_s])
```

trails' `packages/activerecord/src/tasks/mysql-database-tasks.ts:103-112` reads
the file itself with `getFs().readFileSync` and pipes the SQL on the child's
stdin instead, emitting no `--execute` argument at all.

Because of that the three `MySQLStructureLoadTest` tests
(`activerecord/test/cases/adapters/mysql2/mysql2_rake_test.rb:383-432`), which
pin the exact `mysql` argv, have no argv to assert on and are parked as
`it.skip` in `packages/activerecord/src/adapters/mysql2/mysql2-rake.test.ts`
with the divergence named in the skip comment (PR that ported the rest of the
file).

## Acceptance criteria

- [ ] `structureLoad` passes `--execute "SET FOREIGN_KEY_CHECKS = 0; SOURCE
<filename>; SET FOREIGN_KEY_CHECKS = 1"` followed by `--database <db>`,
      line for line with `mysql_database_tasks.rb:58-65`, and stops reading the
      dump file itself.
- [ ] The three `MySQLStructureLoadTest` tests become real tests at their Rails
      names, spying the child-process adapter's `spawnSync` as the ported
      `MySQLStructureDumpTest` tests do.
- [ ] Green on the MariaDB lane, including the `db:test:load` path that uses it.
