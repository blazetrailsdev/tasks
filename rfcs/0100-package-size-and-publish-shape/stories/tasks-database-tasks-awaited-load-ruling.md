---
title: "tasks-database-tasks-awaited-load-ruling"
status: draft
updated: 2026-11-26
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails autoloads `ActiveRecord::Tasks::DatabaseTasks` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record.rb:173-179`), so a constant read in `migration.rb` loads the file on first use. trails#10802 ports that as an awaited `ActiveRecord.Tasks.loadPath["active_record/tasks/database_tasks"]()` at `Migration`'s async entry points (`packages/activerecord/lib/migration.ts`: `Migration#migrate`, `Migrator#run`, `Migrator#migrate`, `checkAllPendingBang`, `anySchemaNeedsUpdate`, `loadSchemaBang`; `lib/schema.ts` `define`).

Two reads stay before any await, because a getter or constructor cannot await:

- `Migrator`'s constructor default arm (`new SchemaMigration(this.connectionPool())`).
- `Migration#connection` / `#connectionPool`, read outside `migrate`.

No CLAUDE.md section ratifies this `loadPath` shape for `Tasks`. The ratified awaited-load sections cover adapters, `message_pack`, nokogiri and mail ("An adapter file is loaded by an awaited step").

## Acceptance criteria

1. The operator rules on one of two shapes:
   - the entry-point awaits, recorded in `packages/activerecord/CLAUDE.md`;
   - a single awaited step (for example beside `ConnectionAdapters.load` in `ConnectionHandler#establishConnection`) that also covers the two synchronous reads.
2. The `@inventedArm loadPath` receipts in `migration.ts` become `PERMANENT` with that citation, or are removed if the shape moves.
