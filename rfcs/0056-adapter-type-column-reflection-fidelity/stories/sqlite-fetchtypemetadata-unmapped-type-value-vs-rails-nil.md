---
title: "sqlite-fetchtypemetadata-unmapped-type-value-vs-rails-nil"
status: ready
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
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

Surfaced by codex review on PR #4762 (sqlite fetchTypeMetadata → cast_type).

`AbstractSQLite3Adapter#fetchTypeMetadata`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1178`) carries
`type: castType.type() !== "value" ? castType.type() : baseSqlType.toLowerCase()`.
Rails' `fetch_type_metadata`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1717`)
stores `type: cast_type.type`, and `ActiveModel::Type::Value#type`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:32-35`) returns `nil`
for an unmapped type.

trails cannot simply carry `castType.type()` because `ValueType`
(`packages/activemodel/src/type/value.ts:201-202`) sets `name = "value"` and
`type()` returns that string — so an unmapped column would reflect
`type: "value"` instead of Rails' `nil`. The base-name fallback (added in #1332)
substitutes an informative, round-trippable SQL name to avoid the opaque
`"value"`.

## Acceptance criteria

- [ ] `ActiveModel::Type::Value#type` (`ValueType#type()`) returns
      `undefined`/`null` for the unmapped default, mirroring Rails `Value#type`
      returning `nil` — audit downstream consumers of `type()` for the string
      `"value"` first.
- [ ] Once the default type is nil-faithful, drop the `!== "value"` base-name
      fallback in `fetchTypeMetadata` and carry `castType.type()` directly.
- [ ] test:compare non-negative; no regression in SQLite column reflection /
      schema round-trip.
