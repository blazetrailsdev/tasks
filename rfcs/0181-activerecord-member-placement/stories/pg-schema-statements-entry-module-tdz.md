---
title: "postgresql/schema-statements.ts throws TDZ as an entry module (schema-definitions imports the adapter at run time)"
status: done
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8636
claim: "2026-10-07T14:33:30Z"
assignee: "pg-schema-statements-entry-module-tdz"
blocked-by: null
closed-reason: null
---

## Context

Importing the built `packages/activerecord/dist/connection-adapters/postgresql/schema-statements.js` as a plain-node entry module throws `Cannot access 'SchemaStatements' before initialization`. Verified on main at bd08db00f9 and unchanged by trails#8583.

The cycle: `postgresql/schema-statements.ts` imports values (`Table`, `TableDefinition`, `AlterTable`, constraint definitions) from `postgresql/schema-definitions.ts`, which has a runtime `import { PostgreSQLAdapter } from "../postgresql-adapter.js"` (schema-definitions.ts:2). `postgresql-adapter.ts` then runs its module-scope `include(PostgreSQLAdapter, SchemaStatements)` while `SchemaStatements` is still in TDZ.

Rails has no such edge: `postgresql/schema_definitions.rb` names nothing from `postgresql_adapter.rb` at load time; constants resolve when the method runs (CLAUDE.md "Call-time constant resolution").

## Acceptance criteria

- [ ] Find what `schema-definitions.ts` uses `PostgreSQLAdapter` for at run time and remove the module-eval edge: a type-only import if it is only a type, else a call-time read through the `ActiveRecord.ConnectionAdapters` namespace seat. No new slot module unless a plain import really closes a cycle.
- [ ] `node -e "import('./dist/connection-adapters/postgresql/schema-statements.js')"` from `packages/activerecord` succeeds, and so does importing `postgresql/schema-definitions.js` and `postgresql-adapter.js` as entry modules.
- [ ] PG adapter tests are green.
