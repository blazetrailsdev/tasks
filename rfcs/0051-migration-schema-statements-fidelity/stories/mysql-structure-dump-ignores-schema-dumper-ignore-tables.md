---
title: "mysql-structure-dump-ignores-schema-dumper-ignore-tables"
status: done
updated: 2026-08-10
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6326
claim: "2026-08-10T10:06:33Z"
assignee: "mysql-structure-dump-ignores-schema-dumper-ignore-tables"
blocked-by: null
closed-reason: null
---

## Context

`MySQLDatabaseTasks#structure_dump`
(`activerecord/lib/active_record/tasks/mysql_database_tasks.rb:47-51`) filters
the dump with `SchemaDumper.ignore_tables`:

```ruby
ignore_tables = ActiveRecord::SchemaDumper.ignore_tables
if ignore_tables.any?
  ignore_tables = connection.data_sources.select { |table| ignore_tables.any? { |pattern| pattern === table } }
  args += ignore_tables.map { |table| "--ignore-table=#{db_config.database}.#{table}" }
end
```

trails' `packages/activerecord/src/tasks/mysql-database-tasks.ts:93-101` never
consults `SchemaDumper.ignoreTables` or `connection.dataSources`, so no
`--ignore-table=` argument is ever emitted and an ignored table lands in the
dump. The PG and SQLite task classes do implement the filter (see
`sqlite-rake.test.ts` "structure dump with ignore tables"), so this is a
mysql-only gap.

`MySQLStructureDumpTest#test_structure_dump_with_ignore_tables`
(`activerecord/test/cases/adapters/mysql2/mysql2_rake_test.rb:315-330`) is
parked as `it.skip` in
`packages/activerecord/src/adapters/mysql2/mysql2-rake.test.ts` naming this gap;
its seven siblings are ported and green.

## Acceptance criteria

- [ ] `structureDump` appends `--ignore-table=<database>.<table>` for every
      `connection.dataSources` entry matching a `SchemaDumper.ignoreTables`
      pattern, in the Rails argv position (after `--skip-comments`, before the
      database name).
- [ ] The skipped test becomes a real test at its Rails name.
- [ ] Green on the MariaDB lane.
