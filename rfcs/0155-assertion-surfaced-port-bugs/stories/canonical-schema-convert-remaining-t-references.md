---
title: "canonical-schema-convert-remaining-t-references"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
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

## Context

Remainder of `canonical-schema-references-follow-adapter-type`. trails#7849 added
the `TableBuilder#references` helper in
`packages/activerecord/src/support/canonical-schema.ts` (it delegates to the
adapter's `TableDefinition#references`, so SQLite gets `integer` per
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_definitions.rb:14-16`)
and converted only the `posts` table (`t.references("author")`), which un-skipped
`base.test.ts` › "primary key and references columns should be identical type".

`vendor/rails/activerecord/test/schema/schema.rb` declares 88 `t.references` /
`t.belongs_to` columns (list them with
`grep -n "t\.\(references\|belongs_to\)" vendor/rails/activerecord/test/schema/schema.rb`).
The other 87 are still expanded in canonical-schema.ts as
`t.bigInteger("<name>_id")`, plus a `t.string("<name>_type")` for
`polymorphic: true` and an explicit `t.index`, so on SQLite each reflects `bigint` where Rails
reflects `integer`.

The helper today accepts only a name and hardcodes `{ index: false }`. Rails'
call sites also pass `polymorphic: true`, `null: false`, `index: false|true|{name:}`,
and `foreign_key: true`.

## Acceptance criteria

- `TableBuilder#references` accepts the options schema.rb passes
  (`polymorphic`, `null`, `index`, `foreignKey`) and forwards them to
  `TableDefinition#references`; `belongsTo` is its alias, as
  `sqlite3/schema_definitions.rb:17` aliases it.
- Every `t.references` / `t.belongs_to` in schema.rb is written as
  `t.references(...)` / `t.belongsTo(...)` in canonical-schema.ts with the same
  options; the hand-expanded `bigInteger` / `_type` / index lines are removed.
- AR suite green on all adapter lanes (column types on SQLite become `integer`).
