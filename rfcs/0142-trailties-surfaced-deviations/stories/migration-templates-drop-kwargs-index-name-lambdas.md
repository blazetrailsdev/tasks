---
title: "migration-templates-drop-kwargs-index-name-lambdas"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
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

# Migration .ts.tt templates define kwargs/indexName lambdas Rails' templates do not have

## Context

`create_table_migration.rb.tt` and `migration.rb.tt`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration/templates/`) emit
`<%= attribute.inject_options %>` / `<%= attribute.inject_index_options %>` and
`:<%= attribute.index_name %>` directly; `GeneratedAttribute#inject_options` /
`#inject_index_options` (`vendor/rails/v8.0.2/railties/lib/rails/generators/generated_attribute.rb`)
return the finished `, key: value` text. trails'
`packages/trailties/lib/generators/active-record/migration/templates/{migration,create_table_migration}.ts.tt`
open with two template-local lambdas, `kwargs(...)` and `indexName(attribute)`, that turn those
fragments into a TS `{ ... }` options literal and a quoted name.

## Acceptance criteria

- `GeneratedAttribute`'s TS `injectOptions` / `injectIndexOptions` / `indexName` return text the
  templates interpolate as-is, and both `.ts.tt` files drop the lambdas.
- `migration-generator.test.ts` stays green with unchanged expected output.
