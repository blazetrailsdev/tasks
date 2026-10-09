---
title: "activerecord: SqlTypeMetadata and MySQL::TypeMetadata deduplicated omit their String dedup lines"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`String#-@` gained a ruby-compat spelling, `strUminus`
(`packages/ruby-compat/src/string/support.ts`, `str_uminus`,
`vendor/ruby/v3.3.11/string.c:3059`), in the PR that closed
`column-deduplicated-drops-the-string-dedup-arms`, and `Column#deduplicated` calls it at Rails'
five sites. Two sibling `deduplicated` bodies still omit theirs:

- `SqlTypeMetadata#deduplicated`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sql_type_metadata.rb:39-42`)
  is `@sql_type = -sql_type` then `super`. The port
  (`packages/activerecord/src/connection-adapters/sql-type-metadata.ts:62-64`) is the `super`
  alone, and `sqlType` is declared `readonly`.
- `MySQL::TypeMetadata#deduplicated`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/type_metadata.rb:32-36`)
  is `__setobj__(__getobj__.deduplicate)`, `@extra = -extra if extra`, `super`.
  `packages/activerecord/src/connection-adapters/mysql/type-metadata.ts` has no `deduplicated`
  member at all, and `extra` is `readonly`.

Neither shows in the arms report: the first has no arm, and the second has no TS member to pair.

## Acceptance criteria

- [ ] `SqlTypeMetadata#deduplicated` assigns `strUminus(this.sqlType)` before `super`.
- [ ] `MySQL::TypeMetadata#deduplicated` is ported with Rails' three statements in order.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline
      row or receipt.
