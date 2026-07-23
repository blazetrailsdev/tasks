---
title: "pg-export-name-ignores-dumper-patterns"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5149
claim: "2026-07-23T14:25:37Z"
assignee: "pg-export-name-ignores-dumper-patterns"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails
`export_name_on_schema_dump?` on index and unique-constraint definitions
(vendor/rails/activerecord/lib/active*record/connection_adapters/postgresql/schema_definitions.rb:209-211
and 231-233) filters auto-generated names via
`SchemaDumper.excl_ignore_pattern.match?` / `unique_ignore_pattern.match?`.
Trails (packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts:98-100
and 134-136) returns `this.name != null` only, even though the patterns exist
at packages/activerecord/src/schema-dumper.ts:346-348. Auto-named
exclusion/unique constraints therefore dump their `excl_rails*_`/`uniq*rails*_`
names instead of omitting them.

## Acceptance criteria

- Both exportNameOnSchemaDump implementations apply the corresponding
  SchemaDumper ignore pattern as Rails does.
- Rails schema-dumper tests covering auto-generated constraint names pass.
