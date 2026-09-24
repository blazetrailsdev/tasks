---
title: "Move MySQL foreignKeys onto AbstractMysqlAdapter"
status: ready
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
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

Split out of `inline-ruby-bodies-extracted-as-named-helpers-remainder` for the
LOC ceiling. `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
exports `foreignKeys` as a `this`-typed module function carrying a
`@noRailsEquivalent CONVERGEABLE` receipt, assigned onto the adapter with
`AbstractMysqlAdapter.prototype.foreignKeys = mysqlForeignKeys` and a
`declare foreignKeys` in `abstract-mysql-adapter.ts`.

Rails defines it as an instance method of `AbstractMysqlAdapter`
(`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:465-509`):
`raise ArgumentError unless table_name.present?`, `quoted_scope`, the
`information_schema` query (no `ORDER BY`), `fk_info.group_by { row["name"] }`
with each group `sort_by! { row["position"] }`, then `unquote_identifier` /
`extract_foreign_key_action` per group.

## Acceptance criteria

- `foreignKeys` is a method in the `AbstractMysqlAdapter` class body with the
  Rails body; the module function, its prototype assignment, `declare` and
  receipt are deleted.
- The `schema-statements.trails.test.ts` `foreignKeys:` tests call it through
  an `AbstractMysqlAdapter` host.
- `pnpm parity:api:extra:gate` stays green.
