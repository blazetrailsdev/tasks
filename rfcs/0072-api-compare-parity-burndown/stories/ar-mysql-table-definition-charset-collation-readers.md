---
title: "ar-mysql-table-definition-charset-collation-readers"
status: in-progress
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5372
claim: "2026-07-26T22:54:56Z"
assignee: "ar-mysql-table-definition-charset-collation-readers"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionAdapters::MySQL::TableDefinition` declares
`attr_reader :charset, :collation`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_definitions.rb:58`).

`packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts:57`
takes `charset`/`collation` as constructor options (:62-:78) but exposes no
readers. Until PR #5344 they scored as matched against the abstract
`TableDefinition`'s unrelated `readonly charset`/`collation` fields
(`connection-adapters/abstract/schema-definitions.ts:852`), because the
includer graph bound `include ColumnMethods` broadly to
`ConnectionAdapters::ColumnMethods` as well as MySQL's own.

## Acceptance criteria

- MySQL `TableDefinition` exposes `charset` and `collation` readers matching
  the Rails `attr_reader`.
- `pnpm api:compare --package activerecord` shows
  `connection_adapters/mysql/schema_definitions.rb` regain the two methods.
