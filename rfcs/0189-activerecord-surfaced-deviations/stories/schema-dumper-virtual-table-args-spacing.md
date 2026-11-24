---
title: "Schema dumper spaces virtual table arguments like inspect"
status: draft
updated: 2026-11-24
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
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

Dumping a schema with an FTS5 virtual table writes `await ctx.createVirtualTable("leaf_search_index", "fts5", ["title","content","tokenize='porter'"]);` (`examples/electron-writebook/db/schema.ts`), where Rails' `SchemaDumper#virtual_tables` writes `["title", "content", "tokenize='porter'"]` with spaces (`vendor/writebook/v1.2.9/db/schema.rb`; `vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_dumper.rb`).

## Acceptance criteria

- The SQLite schema dumper writes virtual-table arguments as Rails' `inspect` does, with ", " separators, and a test pins it.
