---
title: "where-hash-keys-resolve-to-join-alias"
status: claimed
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: "2026-06-17T17:59:48Z"
assignee: "where-hash-keys-resolve-to-join-alias"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story `b3-relation-select-joins` (PR #3416). Rails builds a
WHERE hash against the _aliased_ join table, so its `build_joins` can re-alias a
first/only-occurrence join to the referenced name and the WHERE follows
automatically — e.g. `Pet.joins(:toys).where(toys: { name: "Bone" })` emits
`JOIN da_toys toys ... WHERE toys.name = 'Bone'` (join aliased to `toys`, WHERE
on `toys`).

trails diverges: our where-hash table keys resolve to the join's **real** table
name (`da_toys`), not the reference alias (`toys`). So when PR #3416 threaded
`references_values` into the plain-`joins` JoinDependency (to support per-join
hash-select aliasing), re-aliasing a first-occurrence join desynced the WHERE
(`da_toys.name`) from the JOIN (`da_toys AS toys`), failing on every adapter
(`no such column: da_toys.name` / `invalid reference to FROM-clause entry`).

The PR worked around this with a `_referencedAliasCollisionsOnly` flag on the
plain-`joins` path (`associations/join-dependency.ts` `joinConstraints` /
`_applyReferencedAlias`, opted in from `relation.ts` `_applyJoinsToManager` and
`relation/query-methods.ts` `buildJoins`): a first/only-occurrence join keeps its
real table name; only a duplicate join (already carrying a synthetic collision
alias) is renamed to the referenced name. This is a documented deviation from
Rails — Rails re-aliases first-occurrence joins too.

Converging requires where-hash table keys to resolve to the join's aliased name
(as Rails does), after which the flag can be removed and the plain-`joins` path
can thread references with full first-occurrence aliasing.

Rails: `activerecord/lib/active_record/relation/query_methods.rb`
`build_where_clause` (`references = PredicateBuilder.references(opts);
references_values |= references`) + `arel_column_with_table` →
`predicate_builder.resolve_arel_attribute(table_name, …) { lookup_table_klass_
from_join_dependencies }`; `associations/join_dependency.rb` `make_constraints`
(`@references[reflection.name]` → `aliased_table_for`).

trails: `packages/activerecord/src/relation/predicate-builder.ts` /
`table-metadata.ts` `associatedTable` (resolves the hash key to the real table),
`packages/activerecord/src/associations/join-dependency.ts`
`_referencedAliasCollisionsOnly` (the workaround to remove).

## Acceptance criteria

- [ ] A where-hash table key on a joined association resolves to the join's
      aliased table name (Rails parity), keeping WHERE and JOIN in sync when the
      join is re-aliased to a referenced name.
- [ ] Remove the `_referencedAliasCollisionsOnly` flag and its three call sites;
      the plain-`joins` path threads `references_values` with full first-occurrence
      aliasing like the eager/references path.
- [ ] `delete-all.test.ts` _delete all with joins and where part is hash_ and
      `relation/select.test.ts` _select with hash and table alias_ both still pass
      on SQLite/PG/MySQL.
