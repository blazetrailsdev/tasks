---
title: "data-source-exists-notimplementederror-fallback"
status: ready
updated: 2026-07-28
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
closed-reason: null
---

## Context

Sibling gap to `table-exists-notimplementederror-tables-fallback` (PR #5486),
surfaced during that review. `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:44-48`:

```ruby
def data_source_exists?(name)
  query_values(data_source_sql(name), "SCHEMA").any? if name.present?
rescue NotImplementedError
  data_sources.include?(name.to_s)
end
```

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1612`
`isDataSourceExists` diverges twice:

1. It ORs `tableExists(name) || viewExists(name)` instead of issuing one
   untyped `data_source_sql(name)` query (Rails passes no `type:`, so the
   query matches any relation kind in one round trip).
2. It has no `rescue NotImplementedError` arm degrading to
   `dataSources().includes(String(name))`.

It also uses a bare falsy guard rather than `present?`; #5486 moved
`tableExists` to `isPresent` from `@blazetrails/activesupport`.

Five wide-exclude entries for `data_source_exists?` (`any?`,
`data_source_sql`, `data_sources`, `include?`, `query_values`) sit in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`
carrying the generic RFC 0047 baseline reason; converging the body should
retire at least the `data_sources` and `include?` entries.

## Acceptance criteria

- `isDataSourceExists` guards with `isPresent` and falls back to
  `dataSources().includes(String(name))` on `NotImplementedError`.
- The now-converged `data_source_exists?` wide-exclude entries are removed.
- Verify with the full six-step rails-comparison sequence (including
  `compare.ts --wide-calls` + `lint-call-mismatches-wide.ts`), not just
  `pnpm api:compare`.
