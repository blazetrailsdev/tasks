---
title: "retire-postgresql-with-binds-onto-postgresql-bind-block"
status: in-progress
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6859
claim: "2026-08-22T14:49:29Z"
assignee: "retire-postgresql-with-binds-onto-postgresql-bind-block"
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-to-sql-compile-unification`, which retired
`ToSql#compileWithCollector` and `ToSql#compileWithBinds` onto the single
Rails-shaped `compile(node, collector)`. `PostgreSQLWithBinds`
(`packages/arel/src/visitors/postgresql.ts:149`) was expected to fall out with
them; it does not, because it is not a `compile*` split at all — it is a
`bind_block` split:

```ts
export class PostgreSQLWithBinds extends PostgreSQL {
  protected override bindBlock(): (index: number) => string {
    return (i: number) => `$${i}`;
  }
}
```

Rails has no such class. `Arel::Visitors::PostgreSQL` itself carries the
numbered bind block unconditionally
(`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb:81-84`):

```ruby
BIND_BLOCK = proc { |i| "$#{i}" }
private_constant :BIND_BLOCK
def bind_block; BIND_BLOCK; end
```

So in Rails there is exactly one PostgreSQL visitor and it always emits `$1`,
`$2`, … — never the `?` that `ToSql::BIND_BLOCK` (`to_sql.rb:751-754`) emits.
trails' `PostgreSQL` inherits the `?` block and only the extra subclass emits
`$N`, which is why the split exists.

Call sites of the subclass: `postgresql-adapter.ts:3184` (its `visitor`) and
`packages/arel/src/visitors/postgres.test.ts:126,135,147`. It is exported from
`packages/arel/src/visitors/index.ts:9`.

`pnpm parity:api:extra --package arel` reports `visitors/postgresql.ts` at
1 novel — this class — and it is the file's only extra.

## Converged shape

Move the numbered bind block onto `PostgreSQL` itself, mirroring
`postgresql.rb:81-84`, and delete `PostgreSQLWithBinds` plus its export.
`postgresql-adapter.ts:3184` then constructs `Visitors.PostgreSQL`.

## Watch out

This changes what every PG-visitor compile renders for a `BindParam` /
`ActiveModel::Attribute` from `?` to `$N`, so SQL-text assertions written
against the PG visitor move with it. Re-derive each against the Rails test
rather than pinning the old text; `packages/arel/src/visitors/postgres.test.ts`
holds both spellings today (some through `PostgreSQL`, some through
`PostgreSQLWithBinds`) and the two test names that say `compileWithBinds` now
name a local test helper, not a visitor method.

## Acceptance criteria

- [ ] `PostgreSQL#bindBlock` returns `(i) => "$" + i`, mirroring
      `postgresql.rb:81-84`; `PostgreSQLWithBinds` is deleted along with its
      `visitors/index.ts` export.
- [ ] `pnpm parity:api:extra --package arel` for `visitors/postgresql.ts`:
      novel 1 → 0.
- [ ] `pnpm parity:api:calls` / `:args` green.
- [ ] `pnpm vitest run packages/arel` green, plus the AR PostgreSQL lane.
