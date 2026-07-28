---
title: "Move MySQL dropTable TEMPORARY body to AbstractMysqlAdapter so the mixed-in companion dropTable isn't dead"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails puts the `DROP TEMPORARY TABLE` handling in `AbstractMysqlAdapter#drop_table`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`),
so every MySQL-family adapter inherits it. trails instead defines the whole
`dropTable` body — including the `TEMPORARY` keyword, `IF EXISTS`, `CASCADE`,
and the schema-cache invalidation loop — in the concrete `Mysql2Adapter` class
body (`connection-adapters/mysql2-adapter.ts:1450-1473`), and has
`MysqlSchemaStatements#dropTable`
(`connection-adapters/mysql/schema-statements.ts:79-95`) delegate back to
`this.adapter.dropTable(...)` for the `temporary: true` case.

PR #5490 made `MysqlSchemaStatements` a real mixin on `AbstractMysqlAdapter`
(`include MySQL::SchemaStatements`, `abstract_mysql_adapter.rb:19`). Verified at
runtime after that change: of the companion's four own prototype members
(`schemaCreation`, `addIndex`, `removeColumn`, `dropTable`), `dropTable` is the
one that is mixed onto `AbstractMysqlAdapter.prototype` but permanently shadowed
by `Mysql2Adapter`'s class-body `dropTable`, so the mixed-in copy — and its
`temporary` delegation branch — is dead code on every instantiated adapter.

That dead branch is also a latent recursion trap: if a future MySQL-family
adapter is added without its own class-body `dropTable`, the delegation would
dispatch back to itself. #5490 considered a defensive `adapter !== this` guard
there and deliberately dropped it, because the guard would have silently emitted
a non-`TEMPORARY` `DROP TABLE` rather than fail loudly — fixing the layout is the
right resolution, not guarding the dead path.

Related: [[converge-schema-statements-companion-onto-mixin]] tracks retiring the
`schemaStatements()` companion accessor generally; this story is the narrower
MySQL `dropTable` layout move and can land independently.

## Acceptance criteria

- [ ] `dropTable`'s MySQL-family body (TEMPORARY/IF EXISTS/CASCADE + schema-cache
      invalidation) lives where Rails puts it — `AbstractMysqlAdapter`, mirroring
      `abstract_mysql_adapter.rb#drop_table` — instead of `Mysql2Adapter`.
- [ ] The `temporary`-only delegation back to `this.adapter.dropTable(...)` in
      `MysqlSchemaStatements#dropTable` is removed or reduced to the Rails shape,
      with no path that can dispatch to itself.
- [ ] Existing `dropTable`/temporary-table coverage still passes on mysql2, and
      sqlite3/postgresql are unaffected.
- [ ] `pnpm test:compare --package activerecord --gates --check` exits 0.
