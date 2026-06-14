---
title: "Relocate inline MysqlSchemaStatements class and statement defaults out of mysql2-adapter"
status: done
updated: 2026-06-14
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: ["extract-mysql2-schema-introspection"]
deps-rfc: []
est-loc: 400
priority: null
pr: 3252
claim: "2026-06-14T14:18:33Z"
assignee: "extract-mysql2-schema-statements-class"
blocked-by: null
---

## Context

**This story (~190 moved lines):** the inline
`MysqlSchemaStatements extends SchemaStatements` class at the top of
`mysql2-adapter.ts` moves to a `mysql/` class file mirroring Rails'
`MySQL::SchemaStatements` module, along with `foreignKeys` (~58 lines) and
`parseMysqlName` (~69). `defaultPreparedStatements` STAYS in the adapter —
confirmed: Rails overrides `default_prepared_statements` in
`mysql2_adapter.rb` itself. Driver glue (connect-error translation, URI
parsing, mysql2-npm type mapping) also stays — in Ruby it lives in the
`mysql2` gem, so the adapter is its faithful home.

## Acceptance criteria

- [ ] Listed methods live in the mirrored module file; the adapter only delegates.
- [ ] No behavior change: no test edits beyond import paths; CI green on all three adapters.
- [ ] PR diff under the 500 LOC ceiling; if the group exceeds it, ship the slice that fits and register the remainder as a new story.
