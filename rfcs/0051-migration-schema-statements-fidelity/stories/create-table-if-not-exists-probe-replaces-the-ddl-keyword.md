---
title: "createTable pre-flights tableExists instead of emitting IF NOT EXISTS"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6284
claim: "2026-08-09T20:49:23Z"
assignee: "retire-quoting-dispatch-helpers-onto-self-send"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6287, which converged `create_table`'s `force:` arm to Rails'
single unconditional `drop_table(table_name, force: force, if_exists: true)`
and removed the invented `tableExists` probe that guarded it. The sibling
`if_not_exists:` probe was left in place as out of scope.

Rails' `create_table`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:293-320`)
never asks the database whether the table exists. `if_not_exists:` reaches
`build_create_table_definition` and comes back out as the `IF NOT EXISTS`
keyword in the emitted DDL — `SchemaCreation#visit_TableDefinition`
(`abstract/schema_creation.rb:70-77`) writes
`CREATE TABLE#{' IF NOT EXISTS' if o.if_not_exists}`.

The port
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
`createTable`) pre-flights instead:

    if (options.ifNotExists && (await this.tableExists(name))) {
      return;
    }

Two divergences: an extra round-trip per `if_not_exists:` create (which
inflates `assertQueries` counts the same way the `force:` probe did), and an
early return that skips the whole rest of the body — the pending-index loop
and the table/column comment arms Rails still runs.

## Converged shape

Delete the probe and let the emitted DDL carry `IF NOT EXISTS`, as
`schema_creation.rb:70-77` does. Verify the MySQL lane specifically: the MySQL
`addIndex` pre-flight has a documented reason (`MysqlSchemaCreation` omits the
index-level keyword), which does NOT apply to the table-level keyword — MySQL
supports `CREATE TABLE IF NOT EXISTS`.

Removing the probe changes query counts; re-run the `assertQueries`-bearing
schema/migration suites on all three lanes.

## Acceptance criteria

- [ ] `createTable` has no `tableExists` call; `if_not_exists:` rides the
      emitted DDL keyword.
- [ ] The `if_not_exists:` path runs the same tail of the body Rails runs
      (pending indexes, comments) rather than returning early.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
