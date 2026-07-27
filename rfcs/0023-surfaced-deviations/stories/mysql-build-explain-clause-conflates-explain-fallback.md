---
title: "AbstractMysqlAdapter#buildExplainClause conflates the Explain fallback header and invents option validation"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `MySQL::DatabaseStatements#build_explain_clause`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb:36-46`):

```ruby
def build_explain_clause(options = [])
  return "EXPLAIN" if options.empty?
  explain_clause = "EXPLAIN #{options.join(" ").upcase}"
  if analyze_without_explain? && explain_clause.include?("ANALYZE")
    explain_clause.sub("EXPLAIN ", "")
  else
    explain_clause
  end
end
```

Trails has TWO implementations and they disagree:

1. `packages/activerecord/src/connection-adapters/mysql/database-statements.ts`
   (`buildExplainClause`, around line 69) is the faithful port: `join`,
   `include("ANALYZE")`, returns bare `"EXPLAIN"` when options are empty.
2. `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
   (`buildExplainClause`, around line 1474) is the one the adapter actually
   exposes. It returns `"EXPLAIN for:"` for empty options and routes rendering
   through `_validateExplainOptions`, which rejects unknown flags/formats,
   enforces at most one FORMAT, and reorders FORMAT last.

The `" for:"` suffix belongs to `ActiveRecord::Explain#build_explain_clause`
(`vendor/rails/activerecord/lib/active_record/explain.rb:55-61`), which is the
FALLBACK for adapters that do not respond to `build_explain_clause`. Folding it
into the adapter's own method conflates the two Rails methods, and
`_validateExplainOptions` has no Rails counterpart at all.

Surfaced in #5374; the two wide-call entries (`build_explain_clause` dropping
`include?` and `join`) are baselined against
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
with a reason rather than converged, because collapsing the adapter method onto
the module function would drop the option validation that
`packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts`
currently asserts.

Note PostgreSQL has the same shape at
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:2458`, so
whatever separation is chosen should apply to both adapters.

## Acceptance criteria

- `AbstractMysqlAdapter#buildExplainClause` is the Rails method: no `" for:"`
  suffix, `join` and `include("ANALYZE")` visible in the body.
- The `" for:"` header lives only in `packages/activerecord/src/explain.ts`,
  matching explain.rb:55-61.
- Option validation either moves behind a clearly named non-Rails helper that
  is not on the `build_explain_clause` path, or is justified at its call site
  as a deliberate addition.
- The single module-level `buildExplainClause` in
  `connection-adapters/mysql/database-statements.ts` is the only body; the
  adapter delegates, as `write_query?` / `returning_column_values` already do.
- Both `build_explain_clause` entries drop out of the wide exclude file;
  `pnpm api:calls:wide` baseline strictly shrinks.
- `Relation#explain` output is unchanged on MySQL and MariaDB (the
  `analyze_without_explain?` rewrite still applies).
