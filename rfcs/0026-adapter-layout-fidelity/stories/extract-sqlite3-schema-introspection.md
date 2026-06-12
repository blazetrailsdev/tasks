---
title: "Move SQLite schema-introspection slice from sqlite3-adapter into sqlite3/schema-statements"
status: draft
updated: 2026-06-12
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`sqlite3-adapter.ts` is mostly faithful to Rails' `sqlite3_adapter.rb` — the
big inline sections (the `alter_table` copy strategy and the
`move_table`/`copy_table` rebuild family) are inline in Rails' adapter file
too, so they stay. The deviation is the thinner schema-introspection slice
("Schema introspection" section, roughly lines 1,434–1,691): Rails keeps those
methods in `sqlite3/schema_statements.rb`, and the trails
`connection-adapters/sqlite3/schema-statements.ts` exists but only partially
covers them (~19 functions ported; the rest are inline in the adapter).

Pure code motion: move the introspection methods that Rails houses in
`sqlite3/schema_statements.rb` into the mirrored TS file, leaving the adapter
delegating. The rebuild/alter-table family explicitly stays in the adapter.

## Acceptance criteria

- [ ] Introspection methods with a Rails home in
      `sqlite3/schema_statements.rb` live in
      `connection-adapters/sqlite3/schema-statements.ts`; the adapter only
      delegates.
- [ ] The `alter_table`/`move_table`/`copy_table` rebuild family remains in
      the adapter (matches Rails).
- [ ] No behavior change: no test edits beyond import paths; CI green on all
      three adapters.
- [ ] Diff under the 500 LOC ceiling (pure motion; excluding `.md`).

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb`.
Smallest story in the RFC — fold it in only with the Rails file open
side-by-side; method-by-method placement is the whole point.
