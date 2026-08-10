---
title: "converge pkAndSequenceFor onto Rails' two-query PostgreSQL::Name shape"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5892
claim: "2026-08-02T15:53:58Z"
assignee: "converge-pg-pk-and-sequence-for-onto-two-query-name-shape"
blocked-by: null
closed-reason: null
---

## Context

Deferred by #5409 (RFC 0072
`converge-pg-remove-index-and-new-column-from-field-call-sets`). Rails'
`PostgreSQL::SchemaStatements#pk_and_sequence_for`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`)
runs TWO `query` calls — a pg_depend lookup, then a pg_attrdef fallback — and
returns `[pk, PostgreSQL::Name.new(*result)]`.

trails (`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts#pkAndSequenceFor`,
~line 1778) runs a single rewritten pg_index query whose `LEFT JOIN pg_attrdef`
folds the fallback into one result set, and returns a plain
`{ schema, name }` object rather than a `PostgreSQL::Name`.

The wide call-set baseline entries `pk_and_sequence_for` / `last`, `new`,
`query` in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
carry the justification text today; converging retires all three.

The return-type change ripples into `setPkSequenceBang`,
`resetPkSequenceBang`, `renameTable`, and
`postgresql-adapter.ts:~4065`, plus
`packages/activerecord/src/adapters/postgresql/schema.test.ts`
("pk and sequence for with schema specified", which reads `result[1].schema`).

## Acceptance criteria

- `pkAndSequenceFor` runs Rails' two queries and returns
  `[pk, Name]` using the ported `PostgreSQL::Name` from
  `connection-adapters/postgresql/utils.ts`.
- Callers read `.schema` / `.identifier` off the `Name`.
- The three `pk_and_sequence_for` wide-baseline entries are removed.
- `pnpm parity:api:calls` passes with a strictly smaller baseline.
- Existing PG schema tests keep passing under PostgreSQL.
