---
title: "Converge table-metadata associatedTable to Rails unconditional where-hash aliasing"
status: in-progress
updated: 2026-06-22
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: 3906
claim: "2026-06-22T18:12:02Z"
assignee: "converge-table-metadata-unconditional-where-hash-alias"
blocked-by: null
---

## Context

Surfaced while converging RFC 0030 story `where-hash-keys-resolve-to-join-alias`
(PR #3561). That PR made where-hash table keys resolve to the join's _aliased_
name so a re-aliased first-occurrence join keeps WHERE and JOIN in sync
(`Pet.joins(:toys).where(toys: { name })` -> `JOIN da_toys toys ... WHERE
toys.name`).

It did so by extending the trails-specific indirection in
`packages/activerecord/src/table-metadata.ts` `associatedTable`: the reflection
branch only aliases the association's `arelTable` to the hash key when
`fallback.aliasFor(key)` (`relation/query-methods.ts` `joinTableAliasFor`)
returns the key -- i.e. when the key is an _aliasable_ reference AND a matching
join exists; otherwise it falls back to the association's real table name.

Rails `table_metadata.rb` `associated_table` is simpler and unconditional:

    if association_klass
      arel_table = association_klass.arel_table
      arel_table = arel_table.alias(table_name) if arel_table.name != table_name
      ...

i.e. Rails ALWAYS aliases the resolved table to the hash key when the names
differ, for both the reflection and the block (join-dependency) branch -- there
is no `aliasFor` guard. The WHERE then stays in sync with the JOIN because a
where-hash key is auto-added to `references_values` as an
`Arel::Nodes::SqlLiteral` (`PredicateBuilder.references`), so `make_constraints`
always re-aliases the join to that same name.

trails diverges to dodge the non-joined case (a where-hash key naming an
association that is NOT joined, e.g. an association-subquery): Rails would alias
to the key anyway and emit SQL that requires the join, whereas trails keeps the
real table name. Converging means dropping the `joinTableAliasFor` / `aliasFor`
indirection and aliasing unconditionally like Rails, after confirming the
non-joined where-hash paths (association_query / through subqueries) still
resolve correctly.

Rails: `activerecord/lib/active_record/table_metadata.rb` `associated_table`.
trails: `packages/activerecord/src/table-metadata.ts` `associatedTable`,
`packages/activerecord/src/relation/query-methods.ts` `joinTableAliasFor` (the
indirection to remove).

## Acceptance criteria

- [x] `associatedTable` aliases the resolved association table to the hash key
      whenever `arelTable.name !== key` (Rails parity), for both the reflection
      and the join-dependency fallback branch -- no `aliasFor`/`joinTableAliasFor`
      guard.
- [x] `joinTableAliasFor` and the `aliasFor` plumbing on the where-hash block are
      removed (or reduced to what Rails actually needs), with the non-joined
      where-hash paths (association-query / through subqueries) verified to still
      produce correct SQL.
- [x] The where-hash join-alias regression guard in
      `relation/build-arel-helpers.test.ts` plus the `delete-all` / `relation/select`
      hash-alias tests still pass on SQLite/PG/MySQL, and api:compare / test:compare
      deltas stay non-negative.
