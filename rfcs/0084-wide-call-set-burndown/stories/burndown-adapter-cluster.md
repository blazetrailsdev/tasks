---
title: "B5: converge the adapter cluster"
status: closed
updated: 2026-07-30
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 500
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicates RFC 0076 (execute primitive convergence, 19 open stories), RFC 0051 and RFC 0077, all targeting postgresql-adapter.ts / sqlite3-adapter.ts / abstract-mysql-adapter.ts. 0076 already owns the 152 execute-primitive-family rows. Rows become acceptance criteria there instead (RFC README survey, 2026-07-30)."
---

## Context

The adapter cluster — `connection-adapters/postgresql-adapter.ts` (~110
residual), `sqlite3-adapter.ts` (~63), `abstract-mysql-adapter.ts` (~41),
`abstract/schema-statements.ts` (~43), `abstract/database-statements.ts` (~26),
`abstract-adapter.ts` (~34), `abstract/connection-pool.ts` (~26) — carries
entries for `internal_exec_query`, `internal_execute`, `with_connection`,
`quote_column_name`, `quote_table_name`, `query_value`,
`skip_query_cache_if_necessary`.

A significant share of this cluster is mixin-attribution artifact: Rails
attributes `PostgreSQL::SchemaStatements` methods to `postgresql_adapter.rb`,
while trails ports them into sibling collaborator files. That share is removed
by `resolve-wide-candidates-through-include-graph` in the sibling RFC — this
bundle handles what survives it.

Known blockers to expect: the adapter write-method divergence from the base
class, and RFC 0013's pg raw-connection refinement. Some entries will be
registered as blocked rather than converged.

## Acceptance criteria

- Re-measure AFTER the include-graph resolution lands; the pre-resolution count
  badly overstates the real work here.
- Entries blocked by the adapter write-method divergence or RFC 0013 are filed
  as blocked stories with `pnpm tasks block` and a named blocker — not silently
  left in the baseline with a fresh excuse.
- Split into ~6 PRs by adapter, non-overlapping files, registered as follow-up
  stories.
- Adapter behavior verified per-adapter against the vendored Rails adapter
  tests; remember CI's adapter testing model — pg/mysql lanes are not exercised
  by a default local run.
- Depends on: resolve-wide-candidates-through-include-graph (other RFC).
