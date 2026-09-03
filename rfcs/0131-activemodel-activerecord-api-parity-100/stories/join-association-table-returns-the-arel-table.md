---
title: "join-association-table-returns-the-arel-table"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: 7447
claim: "2026-09-03T15:54:31Z"
assignee: "move-remaining-transaction-manager-delegates-to-database-statements"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:29-32`:

```ruby
def table
  @table ||= tables.first
end
```

`table` answers an **Arel table** on every `JoinPart` — `JoinBase#table` is
`attr_reader :table` (`join_base.rb:9`) and `JoinPart#table` is the abstract
`raise NotImplementedError` (`join_part.rb:44-46`). `JoinDependency::Aliases::Table#column_aliases`
(`join_dependency.rb:38-41`) depends on that: `t = node.table; columns.map { |c| t[c.name].as(c.alias) }`.

trails' `JoinAssociation#table`
(`packages/activerecord/src/associations/join-dependency/join-association.ts:26-38`)
instead answers the **alias string** and keeps the arel node on a separate
`arelTable` field (`join-part.ts:14`), while `JoinBase#table`
(`join-base.ts:14-16`) does return the arel table — so the same reader answers
two different types depending on the subclass.

Surfaced by #7435, which ported `Aliases::Table#column_aliases` and had to
write `this.node!.arelTable` where Rails writes `node.table`.

## Acceptance criteria

- `JoinAssociation#table` returns the arel table (`tables[0]`, memoized), the
  way `join_association.rb:29-32` does, and the `set table(value: string)`
  writer that currently drives aliasing is replaced by whatever Rails actually
  does at those call sites.
- `Aliases::Table#columnAliases` (`join-dependency.ts`) reads `node.table`.
- Every caller of `JoinAssociation#table`'s string form is converged or moved
  to `tableAlias` / `effectiveSqlName`.
- The eager-loading and join suites pass on all adapter lanes.
