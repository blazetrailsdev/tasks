---
title: "Relocate inline MysqlSchemaStatements class and statement defaults out of mysql2-adapter"
status: draft
updated: 2026-06-12
rfc: "0000-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-mysql2-schema-introspection"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**This story (~220 moved lines):** the inline
`MysqlSchemaStatements extends SchemaStatements` class at the top of
`mysql2-adapter.ts` moves to a `mysql/` class file mirroring Rails'
`MySQL::SchemaStatements` module, and `defaultPreparedStatements` (~154 lines)
moves to its Rails placement (check `abstract_mysql_adapter.rb` vs
`mysql2_adapter.rb` first). Driver glue (connect-error translation, URI
parsing, mysql2-npm type mapping) stays in the adapter — in Ruby it lives in
the `mysql2` gem, so the adapter is its faithful home.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
