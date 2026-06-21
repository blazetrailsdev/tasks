---
title: "Utils.extractSchemaQualifiedName collapses 3+ dotted parts instead of taking first two (Rails scan)"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced (FYI, out of scope) during review of #3792. trails'
`Utils.extractSchemaQualifiedName`
(`packages/activerecord/src/connection-adapters/postgresql/utils.ts:48`)
returns `Name(schema, name)` only when `splitQuotedIdentifier` yields exactly 2
parts, and collapses any input with 3+ dotted parts to `Name(null, parts[0])`.

Rails `extract_schema_qualified_name`
(`activerecord/lib/active_record/connection_adapters/postgresql/utils.rb`)
does `schema, table = string.scan(/[^".\s]+|"[^"]*"/)` — destructuring the first
two scanned parts as `schema, table` and ignoring the rest, so a 3+ part input
keeps `parts[0]` as schema and `parts[1]` as table rather than discarding the
schema.

## Acceptance criteria

- [ ] `Utils.extractSchemaQualifiedName` takes the first two parts as
      `schema, table` for 3+ dotted inputs (matching Rails `scan` destructuring),
      instead of collapsing to `Name(null, parts[0])`.
- [ ] A test covers the 3+ dotted-part case against the Rails behavior.
- [ ] api:compare / test:compare delta non-negative.
