---
title: "view-exists-probe-must-be-schema-named"
status: closed
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: landed in PR 5806 (remove-bespoke-adapter-view-exists-overrides) — the base viewExists probe now goes through schemaQuery (SCHEMA-named) with an assertNoQueries regression test at connection-adapters/abstract/schema-statements-view-exists.trails.test.ts"
---

## Context

`SchemaStatements#viewExists`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1518`)
runs its probe through `this.adapter.execute(sql)`, which names the query
`"SQL"`. Rails names it `"SCHEMA"`:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:52-56
def view_exists?(view_name)
  query_values(data_source_sql(view_name, type: "VIEW"), "SCHEMA").any? if view_name.present?
rescue NotImplementedError
  views.include?(view_name.to_s)
end
```

`testing/query-assertions.ts:48` skips payloads whose `name === "SCHEMA"`, so a
`"SQL"`-named reflection probe is counted by `assertQueries` and inflates every
surrounding count. This is exactly the bug PR 5787 hit and fixed for the
sibling `dataSourceExists` (same method family, same Rails idiom): it swapped
`this.adapter.execute(sql)` for `this.adapter.schemaQuery(sql)`, trails' stand-in
for `internal_exec_query(sql, "SCHEMA")` (`abstract-adapter.ts:980`).

`viewExists` is currently green only because no `assertQueries` block happens to
straddle a view-existence probe — it is latent, not correct. It was deliberately left out of the PR that fixed dataSourceExists, to keep that PR scoped to its own story.

## Acceptance criteria

- `SchemaStatements#viewExists` issues its `dataSourceSql(..., { type: "VIEW" })`
  probe via `this.adapter.schemaQuery(sql)`, so the query is named `"SCHEMA"`.
- A regression test wraps a `viewExists` call in `assertQueries(0)` (or the
  equivalent counting helper) and fails on the current `execute` baseline.
- Audit the rest of `abstract/schema-statements.ts` for other reflection probes
  still going through `execute` instead of `schemaQuery`, and convert them.
