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

PR #4762 removed the base-name fallback in `fetchTypeMetadata`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1181`) and now
carries `type: castType.type()` directly, matching Rails' `fetch_type_metadata`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1717`)
which stores `type: cast_type.type`.

One residual gap remains: for an unmapped `sql_type` the SQLite type map returns a
`ValueType`. Rails' `ActiveModel::Type::Value#type`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:32-35`) returns `nil`,
but trails' `ValueType` (`packages/activemodel/src/type/value.ts:201-202`) sets
`name = "value"` and `type()` returns that string — so an unmapped column reflects
`type: "value"` instead of Rails' `nil`. This is a cross-cutting ActiveModel
concern (every `ValueType` fallback across adapters), not SQLite-specific.

## Acceptance criteria

- [ ] `ActiveModel::Type::Value#type` (`ValueType#type()`) returns
      `undefined`/`null` for the unmapped default, mirroring Rails `Value#type`
      returning `nil` — audit downstream consumers of `type()` for the string
      `"value"` first (schema dumper, column reflection, all adapters).
- [ ] test:compare non-negative; no regression in column reflection / schema
      round-trip across sqlite/postgres/mysql.
