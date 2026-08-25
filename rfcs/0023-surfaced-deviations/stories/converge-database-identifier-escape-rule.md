---
title: "Converge the three copies of the database identifier escape rule onto one per adapter"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence story: a DRY dedupe of three identifier-escape copies; no behavioral divergence from Rails is named and the escape rule itself already matches postgresql/quoting.rb."
---

## Context

The rule for quoting a database identifier — wrap in the adapter's quote
character and double any embedded occurrence — is now spelled three times in
trails:

- `packages/activerecord/src/support/quote-database-name.ts` (added by PR #5638,
  because `globalSetup` builds DDL against the raw `pg` and `mysql2` drivers and
  so cannot reach an adapter method).
- `packages/activerecord/src/tasks/postgresql-database-tasks.ts:354` and
  `packages/activerecord/src/tasks/mysql-database-tasks.ts:355`, both a private
  `escapeIdent`.
- The adapters' own `quoteColumnName` / `quoteTableName`, which is where Rails
  keeps the single copy (`postgresql/quoting.rb:46-48`,
  `mysql/quoting.rb:46-48`), reached by `drop_database` via `quote_table_name`
  (`postgresql/schema_statements.rb:53-54`,
  `abstract_mysql_adapter.rb:292-293`).

Rails has one implementation per adapter and every caller dispatches to it.
trails has three, so a fix to one does not reach the others — and the copies are
not even identical in intent: the adapter `quoteTableName` mirrors Rails'
qualified-name dot split, which is correct for a table and wrong for a database
name.

## Acceptance criteria

- One implementation of the identifier-escape rule per adapter, with the
  database-name callers dispatching to it rather than re-spelling it.
- The connection-less constraint that motivated the third copy is addressed
  head-on: either the shared rule is reachable without an adapter instance, or
  the reason it cannot be is recorded at the remaining call site.
- The database-name path keeps NOT applying Rails' qualified-name dot split, and
  the reason stays documented — a database name is never schema-qualified, and
  splitting corrupts the leftover the `globalSetup` sweep exists to drop.
- Existing behaviour is preserved: `quote-database-name.test.ts` and the
  database-tasks suites still pass.
