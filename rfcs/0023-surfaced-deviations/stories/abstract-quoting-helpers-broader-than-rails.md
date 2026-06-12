---
title: "AbstractAdapter quoting helpers diverge from Rails abstract (concrete quoteColumnName default, dot-splitting quoteTableName)"
status: draft
updated: 2026-06-11
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' abstract `Quoting` module
(`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb`) is
deliberately minimal at the class level:

- `quote_column_name` (L61) — **`raise NotImplementedError`**; every adapter
  must define its own.
- `quote_table_name` (L66) — defaults to `quote_column_name(table_name)`,
  with **no dot-splitting**; schema-qualified handling is adapter-specific
  (PG splits on `.`, MySQL backtick-quotes each part, SQLite does not split).
- Instance `quote_column_name`/`quote_table_name` (L136/L141) delegate to the
  class methods.

Our abstract module
(`packages/activerecord/src/connection-adapters/abstract/quoting.ts`) is
**broader than Rails**:

- `quoteIdentifier` (L26) — ANSI double-quote implementation with `""`
  escaping; no Rails counterpart at this layer.
- `quoteColumnName` (L47) — concrete (delegates to `quoteIdentifier`) instead
  of abstract/throwing.
- `quoteTableName` (L35) — unconditionally splits on `"."` and quotes each
  part, which Rails only does in specific adapters.

Why it matters: the concrete defaults mask adapter bugs (an adapter that
forgets its override silently gets ANSI quoting instead of failing fast, which
on MySQL produces wrong SQL), and the unconditional dot-split changes behavior
for column names that legitimately contain dots (Rails quotes
`"foo.bar"` as one identifier via `quote_column_name`, we'd emit
`"foo"."bar"`). It also skews the file-level api:compare mapping (extra
exported helper).

Work: make the abstract layer mirror Rails — `quoteColumnName` throws
`NotImplementedError` (verify each adapter's `quoting.ts` already overrides
it: `mysql/`, `postgresql/`, `sqlite3/` all exist), `quoteTableName` defaults
to `quoteColumnName` with no splitting, and the dot-splitting moves into the
adapters that actually do it in Rails (compare each adapter's
`quote_table_name` in the vendored source). Fold/relocate `quoteIdentifier`
into whichever adapter(s) genuinely share it, or mark `@internal` if it must
stay. Audit call sites that relied on the abstract dot-split
(`quoteTableNameForAssignment` at L157 builds `table.attr` and round-trips
through `quoteTableName` — Rails' version delegates to `quote_table_name`
**without** the split working by accident; check MySQL's override which is
where Rails documents the `table.column` trick).

## Acceptance criteria

- [ ] Abstract `quoteColumnName` raises (mirrors quoting.rb L61); abstract
      `quoteTableName` = `quoteColumnName(name)` with no dot-split (L66);
      per-adapter overrides match their Rails adapter's `quote_table_name`
      behavior verbatim (cite each in the PR).
- [ ] `quoteTableNameForAssignment` matches Rails semantics per adapter
      (MySQL `table`.`column`; others delegate).
- [ ] Existing quoting tests pass unmodified on SQLite/PG/MySQL locally (no
      test renames); any newly-exposed adapter gap gets its own story rather
      than a workaround here.
- [ ] `pnpm api:compare --package activerecord` stays at 100% with no new
      extra methods on the abstract quoting file.
