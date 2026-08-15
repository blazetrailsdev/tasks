---
title: "mysql-build-explain-clause-drops-for-suffix"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# MySQL's build_explain_clause must not append " for:" (and drop its statement twin)

## Context

PR #6581 fixed this exact defect on the PostgreSQL side; MySQL carries an
identical copy that was left alone because it lives in a different file and the
PR was scoped to `postgresql-adapter.ts`.

Rails puts the `" for:"` suffix in exactly one place: `ActiveRecord::Explain`'s
**private fallback**, used only when the connection does not define
`build_explain_clause` (`explain.rb:56-61`):

```ruby
def build_explain_clause(connection, options = [])
  if connection.respond_to?(:build_explain_clause, true)
    connection.build_explain_clause(options)
  else
    "EXPLAIN for:"
  end
end
```

MySQL **does** define one, and it returns a bare clause
(`mysql/database_statements.rb:36-46`): `"EXPLAIN"`, or
`"EXPLAIN #{options.join(" ").upcase}"`, with the leading `EXPLAIN` keyword stripped
when `analyze_without_explain?`. No `" for:"`.

trails' `abstract-mysql-adapter.ts:1303-1306` returns `"EXPLAIN for:"` /
`` `${await this._explainClause(options)} for:` ``. Because the header and the
executed statement had to differ once the suffix was baked in, it also grew a
private `_explainClause` / `_explainStatementClause` twin
(`abstract-mysql-adapter.ts:1321`, `:1369`) — the same invented duplication PR
PR #6581 deleted from the PG adapter, where one `build_explain_clause` serves both
roles (`postgresql/database_statements.rb:8`).

Related: `AbstractAdapter#buildExplainClause`
(`connection-adapters/abstract-adapter.ts:939-951`) is itself invented surface —
Rails' `AbstractAdapter` defines no `build_explain_clause` at all, which is
precisely why `explain.rb` probes with `respond_to?`. Its existence means every
trails adapter answers the probe, so the `"EXPLAIN for:"` fallback is now
unreachable and SQLite only produces the Rails-correct header by accident.
Retiring it is what makes the `respond_to?` branch meaningful again.

## Acceptance criteria

- [ ] `AbstractMysqlAdapter#buildExplainClause` returns the Rails clause with no
      `" for:"` suffix, matching `mysql/database_statements.rb:36-46`, including
      the `analyze_without_explain?` arm that strips the leading `EXPLAIN` keyword.
- [ ] The `_explainClause` / `_explainStatementClause` twin is deleted; `explain`
      composes its SQL from `buildExplainClause` + `toSql` as
      `mysql/database_statements.rb` does.
- [ ] `AbstractAdapter#buildExplainClause` is removed so `explain.rb`'s
      `respond_to?(:build_explain_clause, true)` probe means what it means in
      Rails, and SQLite reaches the `"EXPLAIN for:"` fallback by the Rails path
      rather than by an invented override.
- [ ] `pnpm parity:api:extra --package activerecord` falls (invented surface
      removed); `pnpm parity:api:calls` green.
- [ ] MySQL/MariaDB explain assertions updated to the Rails header, no test
      renamed.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
