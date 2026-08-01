---
title: "Remove the bespoke adapter viewExists overrides and route through the converged base"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5806
claim: "2026-08-01T17:51:01Z"
assignee: "remove-bespoke-adapter-view-exists-overrides"
blocked-by: null
closed-reason: null
---

## Context

Direct sibling of the merged story
`remove-bespoke-adapter-data-source-exists-overrides` (PR 5787). Rails defines
`view_exists?` only in
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:74`
— no concrete adapter overrides it. It is answered from the base body plus each
adapter's `data_source_sql(name, type: "VIEW")` / `quoted_scope`:

```ruby
def view_exists?(view_name)
  query_values(data_source_sql(view_name, type: "VIEW"), "SCHEMA").any? if view_name.present?
rescue NotImplementedError
  views.include?(view_name.to_s)
end
```

trails still shadows it:

- `mysql2-adapter.ts:1516` → `informationSchemaExists(name, "VIEW")`, a bespoke
  bind-parameter `information_schema.tables` query with a COALESCE schema shape
  Rails does not emit.
- `postgresql/schema-statements-class.ts` carries a `tableExists` companion in
  the same family; audit it for a `viewExists` shadow too.

The base `viewExists`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1518`)
is already converged onto the Rails shape, and every adapter already has a
faithful `dataSourceSql` override (verified line-by-line during PR 5787), so
deleting the shadows should route everything through the base. Note that
`include(AbstractAdapter, SchemaStatements)` puts the base body on every
adapter's prototype chain, so the overrides can be deleted outright rather than
replaced with delegation stubs.

## Acceptance criteria

- Adapter-level `viewExists` overrides are deleted; all callers reach the base
  body plus each adapter's `dataSourceSql(..., { type: "VIEW" })`.
- Any behaviour the overrides carried that the base lacks moves into
  `dataSourceSql` / `quotedScope`, which is where Rails puts it.
- If `informationSchemaExists` loses its last caller, it goes too.
- Existing view / schema-statements suites pass on sqlite, pg and mysql.

## Trap

Land this together with, or after, `view-exists-probe-must-be-schema-named`.
The base body currently probes via `this.adapter.execute(sql)`, which names the
query `"SQL"`; the bespoke overrides use `schemaQuery` (name `"SCHEMA"`). Query
counting skips only `"SCHEMA"`, so deleting the overrides first will inflate
`assertQueries` counts in unrelated suites on all three adapter lanes. This
exact sequence cost PR 5787 a CI round.
