---
title: "The schema dumper's adapter type argument is receipted PERMANENT without a ratifying ruling"
status: draft
updated: 2026-10-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Landed by trails#8812. A schema dumped in the `ts` format names the adapter it
was dumped from, so `Schema.define`'s block gets that adapter's
`TableDefinition`:

```ts
import type { PostgreSQLAdapter } from "@blazetrails/activerecord/connection-adapters/postgresql-adapter.js";

await Schema.get(8).define<PostgreSQLAdapter>({ version: 1 }, async (ctx) => {
```

Rails' header is one `ActiveRecord::Schema[...].define(...) do` line
(`activerecord/lib/active_record/schema_dumper.rb:96-110`), and its
`dump_schema` calls `ActiveRecord::SchemaDumper.dump(migration_connection_pool, file)`
with two arguments (`activerecord/lib/active_record/tasks/database_tasks.rb:439-443`).
trails added four things Rails does not have, each receipted `PERMANENT` on
the author's judgement with no ratifying section:

- `SchemaDumper#adapterType()` (`packages/activerecord/src/schema-dumper.ts`),
  a protected hook overridden in `connection-adapters/postgresql/schema-dumper.ts`,
  `mysql/schema-dumper.ts` and `sqlite3/schema-dumper.ts`. It is protected, so
  `parity:api:extra` does not measure it and reports a `@noRailsEquivalent`
  tag on it as stale.
- `header`'s `@inventedArm adapterType — PERMANENT` and
  `@inventedArm schemaFormat — PERMANENT`.
- `generateOptions` forwarding a `schemaFormat` key Rails' `generate_options`
  does not build (`schema_dumper.rb:52-57`).
- `DatabaseTasks.dumpSchema` passing a third argument to `SchemaDumper.dump`,
  receipted `@missingRailsArgs dump — PERMANENT`
  (`packages/activerecord/src/tasks/database-tasks.ts`).

Root `CLAUDE.md` § "A documented deviation is debt, not permission" allows a
`PERMANENT` receipt only once the limit is ratified in a CLAUDE.md or ruled on
by the repo owner. Neither has happened. The nearest ratified neighbour is
`packages/activerecord/CLAUDE.md` § "A dumped statement wraps its trailing
options in braces", which is scoped to the brace arm only.

## Converged shape

Either of these closes the story:

- The repo owner rules the adapter type argument a language shortcoming (a
  TypeScript dump needs the adapter named to type `t.jsonb`; a Ruby dump does
  not), and a section in `packages/activerecord/CLAUDE.md` records it and is
  cited by the four receipts.
- The dump stops needing the hook: for example `Schema.define`'s block is typed
  from something the header already emits, so `adapterType()`, the
  `schemaFormat` option and the third `dump` argument are deleted and
  `dump_schema` calls `SchemaDumper.dump(migrationConnectionPool, file)` as
  Rails does.

## Acceptance criteria

- [ ] every `PERMANENT` receipt added by trails#8812 cites a ratified section,
      or is deleted with the code it covers
- [ ] if the hook is removed, a PostgreSQL dump containing `t.jsonb` still
      typechecks (`packages/activerecord/dx-tests/schema-dump.test-d.ts`) and
      still loads (`schema-dumper.trails.test.ts`)
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:arms:throws` are green
