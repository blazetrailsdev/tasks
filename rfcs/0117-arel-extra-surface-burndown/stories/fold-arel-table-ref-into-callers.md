---
title: "fold-arel-table-ref-into-callers"
status: done
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6864
claim: "2026-08-22T16:49:57Z"
assignee: "fold-arel-table-ref-into-callers"
blocked-by: null
closed-reason: null
---

# Fold `arel/table-ref.ts` into its callers

## Context

Split out of `arel-no-counterpart-invented-files` (RFC 0117), which disposed of
the other four no-counterpart arel files (two deleted as dead duplicates, two
tagged). `packages/arel/src/table-ref.ts` is the remaining one: 28 lines, 3
extras — the `TableRef` union type plus `tableSqlName` / `tableRealName`.

Rails writes neither. It treats `Arel::Table` and `Arel::Nodes::TableAlias`
polymorphically:

- `table_alias.rb:6-8` aliases `name`/`relation`/`table_alias` onto the Binary,
  and `:14-16` defines `table_name`;
- `table.rb:11-12` has `attr_accessor :name` and `attr_reader :table_alias`.

So `tableSqlName(rel)` is Rails' uniform `relation.table_alias || relation.name`
(trails needs `relationName()` around it only to unwrap a `SqlLiteral` alias),
and `tableRealName(rel)` is `table_name` on a `TableAlias` and `name` on a
`Table`.

Deferred from the parent story because the fold is cross-package and wide:
~20 call sites across `activerecord` (`associations/join-dependency.ts`,
`join-dependency/join-association.ts`, `join-dependency/join-part.ts`,
`associations/alias-tracker.ts`, `reflection.ts`, plus four test files) import
the type and the two readers from `@blazetrails/arel`.

## Acceptance criteria

- [ ] `packages/arel/src/table-ref.ts` is deleted, and its export line removed
      from `packages/arel/src/index.ts`.
- [ ] Call sites read Rails' own expression, against members that exist on both
      `Table` and `Nodes::TableAlias` at the Rails names.
- [ ] `pnpm parity:api:extra --package arel` `noCounterpartFiles` drops by 1 and
      total extras by 3, with no new tag.
- [ ] `pnpm vitest run packages/arel` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
