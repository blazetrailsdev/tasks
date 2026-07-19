---
title: "Extend host-receiver requirement to quoteTableName / quoteDefaultExpression"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-19T15:01:09Z"
assignee: "require-host-receiver-quote-table-name-default-expression"
blocked-by: null
---

## Context

PR #3892 (remove-receiverless-quoting-dispatch-support) made `this` required on
the abstract + adapter `quote` / `typeCast` (and abstract `quotedTime`), so a
receiver-less call is a compile error. To keep that PR scoped it left two sibling
dispatch methods still tolerating a receiver-less call:

- `connection-adapters/abstract/quoting.ts` `quoteTableName(this: QuotingDispatchHost | void, name)`
  — dispatches to `this.quoteColumnName` else falls back to the throwing module
  `quoteColumnName`. Still `| void`.
- `connection-adapters/abstract/quoting.ts` `quoteDefaultExpression(this: QuotingDispatchHost | void, value, _column?)`
  — now threads `this` to `quote.call(this || {}, value)`, but the `this` is
  still optional (`| void`). PG and SQLite ports added the same `this || {...}`
  fallback (`postgresql/quoting.ts`, `sqlite3/quoting.ts`).

Rails has these as `self`-dispatching instance methods on the Quoting module
(quote_table_name → quote_column_name; quote_default_expression → quote), so a
receiver is always present — same rationale as the merged PR.

## Acceptance criteria

- Drop `| void` on `quoteTableName` / `quoteDefaultExpression` (abstract + PG +
  SQLite ports) so receiver-less invocation is a compile error.
- Replace the `this || {}` / `this || { quotedDate, quotedTime }` internal
  fallbacks with the required receiver; update any adapter-free callers
  (ABSTRACT_SCHEMA_QUOTER, mysql/schema-quoter, sanitization ABSTRACT_QUOTER) to
  bind a host explicitly.
- No behavior change for adapter-routed calls; quoting / schema-creation /
  sanitization tests pass. api:compare / test:compare delta non-negative.
