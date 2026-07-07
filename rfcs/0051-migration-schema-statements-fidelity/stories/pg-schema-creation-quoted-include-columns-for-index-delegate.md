---
title: "PG SchemaCreation quotedIncludeColumns should delegate to quotedIncludeColumnsForIndex"
status: done
updated: 2026-07-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 52
pr: 4053
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `PostgreSQL::SchemaCreation` (postgresql/schema_creation.rb:8,143-145)
`delegate :quoted_include_columns_for_index, to: :@conn` and implements
`quoted_include_columns(o) = String === o ? o : quoted_include_columns_for_index(o)`.

trails (postgresql/schema-creation.ts:302) inlines the non-string branch
(`o.map(quoteIdentifier).join(", ")`) directly inside `quotedIncludeColumns`
instead of delegating to a `quotedIncludeColumnsForIndex` on the adapter. This
is the single remaining `api:compare` miss for PG schema_creation
(`visit_AddForeignKey` is now matched after PR #3939 — 14/15).

The inline implementation should match the adapter's
`quoted_include_columns_for_index` (PostgreSQL::SchemaStatements) so that any
adapter-specific quoting/expression handling is the single source of truth, and
the method name surfaces in api:compare.

## Acceptance criteria

- [ ] Add `quotedIncludeColumnsForIndex` to the PG adapter (mirroring Rails
      `PostgreSQL::SchemaStatements#quoted_include_columns_for_index`).
- [ ] `quotedIncludeColumns` delegates to it (Rails parity), keeping the
      `String === o` short-circuit.
- [ ] api:compare PG schema_creation reaches 15/15; no test:compare regression.
- [ ] No test-name changes.
