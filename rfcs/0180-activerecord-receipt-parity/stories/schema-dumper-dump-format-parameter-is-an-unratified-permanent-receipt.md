---
title: "activerecord: SchemaDumper.dump's format parameter rides an unratified PERMANENT @missingRailsArgs receipt"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8708
claim: "2026-10-09T13:39:39Z"
assignee: "collection-proxy-each-synchrony-is-decided-in-three-places"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8703, which collapsed `SchemaDumper.language` into `ActiveRecord.schema_format`.

Rails' `dump_schema` calls `ActiveRecord::SchemaDumper.dump(migration_connection_pool, file)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:441`), and `SchemaDumper.dump(pool = ..., stream = $stdout, config = ActiveRecord::Base)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb`) takes no format: a Ruby dump has one language.

trails dumps `"ts"` or `"js"`, and `format` is threaded as a parameter rather than assigned to the seat, so:

- `SchemaDumper.dump` in `packages/activerecord/src/schema-dumper.ts` has a fourth parameter `format?: SchemaFormat`, written into `options.format`; the constructor reads `options.format ?? schemaFormat()`.
- `DatabaseTasks.dumpSchema` in `packages/activerecord/src/tasks/database-tasks.ts` passes `SchemaDumper.dump(migrationConnectionPool, file, undefined, format)` under `@missingRailsArgs dump — PERMANENT`.

That `PERMANENT` was assigned by the PR author on the strength of the story ruling ("the dump language rides `ActiveRecord.schema_format`"), not by a CLAUDE.md section. No section ratifies a format parameter on the dumper.

## Acceptance criteria

- [ ] Either the owner ratifies the dumper's `format` parameter in `packages/activerecord/CLAUDE.md` and the receipt cites it, or the call converges to Rails' two-argument `SchemaDumper.dump(migrationConnectionPool, file)` with the dumper learning ts-vs-js some other ruled way.
- [ ] `schema:dump --format js` still writes a JS header into `schema.js` (`packages/trailties/src/commands/db.test.ts`).
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:receipts:gate` green.
