---
title: "activerecord: SchemaDumper.language is a mutable class static Rails has no seat for"
status: in-progress
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8703
claim: "2026-10-09T02:02:50Z"
assignee: "schema-cache-load-from-ports-the-marshal-and-yaml-load-arms"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/schema-dumper.ts:151-152` declares `static language: SchemaDumpLanguage = "ts"` on
`SchemaDumper`. `vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb` has no such
member: a Ruby dump is always Ruby, and the only format switch is `ActiveRecord.schema_format`
(`:ruby` / `:sql`, `vendor/rails/v8.0.2/activerecord/lib/active_record.rb:372-373`). The name scores
as a moved extra and carried `@noRailsEquivalent PERMANENT`.

**The decision (Dean, 2026-10-08): the dump language rides `ActiveRecord.schema_format`, whose value
set is `"ts"` / `"js"` / `"sql"` — `"ts"` and `"js"` in place of Rails' `:ruby`, and `"sql"` exactly
as Rails has it.** The seat already exists and is already Rails-shaped; what is wrong is that trails
encodes the choice on **two** axes instead of one:

- `packages/activerecord/src/tasks/database-tasks.ts:45` declares `SchemaFormat = "ruby" | "sql"`,
  seated at `packages/activerecord/src/active-record.ts:44` with the default `"ruby"` and read /
  written by `schemaFormat()` / `setSchemaFormat()` (`active-record.ts:313-319`). `"ruby"` is a dead
  label in trails: nothing dumps Ruby.
- the real ts-vs-js choice then rides the second axis, `SchemaDumper.language`, which three sites
  read or write:
  - `SchemaDumper`'s constructor, `options.language ?? this.constructor.language`
    (`schema-dumper.ts:179-181`), feeding the `_language` branches at `:305` and `:314`.
  - `packages/activerecord/src/database-configurations/hash-config.ts:146-154` `schemaFileType`:
    its `"ruby"` arm returns `schema.` plus `SchemaDumper.language`, where Rails answers the literal
    `"schema.rb"` (`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/hash_config.rb:169-177`).
  - `packages/trailties/src/commands/db.ts:264-283` `withResolvedSchemaFormat`: saves both the format
    and the static, assigns them, and restores both in a `finally`.

Collapsing the two axes into one retires the static and the save / restore together. Rails never
saves and restores the seat: `format` is a parameter defaulting to `ActiveRecord.schema_format` and
threaded explicitly — `schema_dump(format = ActiveRecord.schema_format)` (`hash_config.rb:149`),
`dump_schema(db_config, format = ActiveRecord.schema_format)` (`database_tasks.rb:431`),
`schema_dump_path(db_config, format = ActiveRecord.schema_format)` (`database_tasks.rb:455`), with
the rake task passing `ENV.fetch("SCHEMA_FORMAT", ActiveRecord.schema_format).to_sym` down as an
argument (`databases.rake:452`). trails already threads it that way at `hash-config.ts:117` and
`database-tasks.ts:504,523`. A set / restore around an awaited block is also the shape that leaks
across concurrent async callers.

## Acceptance criteria

- [ ] `SchemaFormat` is `"ts" | "js" | "sql"`, and the `active-record.ts` seat defaults to `"ts"`.
      The `"ruby"` value is gone.
- [ ] `SchemaDumper.language`, `SchemaDumpLanguage`, the `language` dump option and the
      `@noRailsEquivalent` receipt are deleted. The dumper reads the format it is handed, and its
      `:305` / `:314` branches turn on `"ts"` vs `"js"`.
- [ ] `HashConfig#schemaFileType` answers `schema.ts` / `schema.js` / `structure.sql` from `format`
      alone, in Rails' `case` shape, with no `SchemaDumper` import.
- [ ] `withResolvedSchemaFormat` no longer saves or restores a class static. Prefer threading
      `format` into `DatabaseTasks.dumpSchema` as Rails' rake task does (`databases.rake:452`) over
      assigning the seat around an awaited block.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green; `packages/activerecord/src/schema-dumper.test.ts`
      and the trailties `db` command tests stay green.
