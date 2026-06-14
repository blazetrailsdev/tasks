---
title: "MySQL indexes introspection: unescape expressions + surface lengths/orders"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during PR #3280 (`extract-mysql2-indexes-introspection`, RFC 0026), a
pure code-motion PR that moved `indexes` + `statisticsHasExpressionColumn` from
`mysql2-adapter.ts` into `connection-adapters/mysql/schema-statements.ts`. A
Claude review flagged five divergences from Rails `mysql/schema_statements.rb`'s
`indexes`. All pre-date the PR (code moved unchanged); fixing them was out of
scope for a no-behavior-change extraction. Triage below.

Root cause for most: trails reads `information_schema.statistics`, whereas Rails
uses `SHOW KEYS FROM`. This mirrors the deliberate `columns` choice
(`information_schema.columns` vs Rails' `SHOW FULL FIELDS`).

### Genuine gaps to fix here

- **Expression unescape** — Rails does `expression.gsub("\\'", "'")` before
  wrapping a functional-index expression in parens
  (`mysql/schema_statements.rb:38`). trails wraps the raw `EXPRESSION` value.
  Verify whether `information_schema.statistics.EXPRESSION` returns
  backslash-escaped quotes on MySQL 8.0.13+; if so, add the unescape.
- **`lengths` (prefix indexes) and `orders` (DESC) dropped** — Rails populates
  per-column `lengths` from `Sub_part` and `orders` from `Collation == "D"`
  (`mysql/schema_statements.rb:43-47`). `information_schema.statistics` exposes
  both `SUB_PART` and `COLLATION` columns, so this can be fixed without changing
  the query source — select them, extend the `indexes` return shape, and feed
  `IndexDefinition`.

### Reviewed and justified as-is (no change needed)

- **`SHOW KEYS` vs `information_schema`** — deliberate, consistent with `columns`.
  Switching is a much larger architectural change, not a bug.
- **Missing `StatementInvalid` rescue for non-existent table** — Rails needs the
  rescue because `SHOW KEYS` _raises_ on a missing table. An
  `information_schema.statistics` query returns **zero rows** for a missing
  table, so trails already yields `[]` naturally. No divergence in observable
  behavior.
- **No unit tests for `indexes`/`statisticsHasExpressionColumn`** — matches the
  established precedent: the sibling async introspection functions `columns` and
  `foreignKeys` also have no unit tests in `mysql/schema-statements.test.ts`;
  they're covered by integration tests against a live DB. When fixing the gaps
  above, add focused coverage for the new expression-unescape and
  lengths/orders logic.

## Acceptance criteria

- [ ] Functional-index expressions are unescaped to match Rails (or a comment
      documents why the information_schema path needs no unescape).
- [ ] `indexes` surfaces prefix `lengths` and `orders` (DESC) per column.
- [ ] Coverage for the new logic; behavior verified on MySQL 8 + MariaDB.
