---
title: "arel-join-tables-lack-type-casters"
status: done
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4889
claim: "2026-07-15T11:11:11Z"
assignee: "arel-join-tables-lack-type-casters"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while doing `arel-table-type-cast-fallbacks-are-invented` (PR pending).
That story converged `Table#typeCastForDatabase` and both `TableAlias`
delegators to bare calls, but had to LEAVE `Table#typeForAttribute`'s invented
`typeCaster &&`/`typeof === "function"` guard + `undefined` fallback in place
(`packages/arel/src/table.ts:164-186`, marked `// DEVIATION:`).

Rails delegates bare (`arel/table.rb:106-108`):

```ruby
def type_for_attribute(name)
  type_caster.type_for_attribute(name)
end
```

so a caster-less table raises `NoMethodError`. Removing our fallback is
blocked because trails constructs **caster-less** `Arel::Table`s for join
aliases, where Rails aliases `klass.arel_table` (which carries a
`TypeCaster::Map` / `TypeCaster::Connection`) and so keeps the caster.

`Table#alias` wraps in a `TableAlias` whose delegators forward to the
underlying `Table`, so Rails' aliased tables retain their caster for free
(`alias_tracker.rb:58-70` — `arel_table.alias(table_name)`). trails instead
does `new Table(name, { as: alias })`, dropping it.

## Why it breaks (measured, not theoretical)

`Table#typeForAttribute` is reached **ungated** via `Attribute#typeCaster`
(`attribute.ts:110-112`, no `able_to_type_cast?` gate — Rails has none either)
→ `HomogeneousIn#castedValues` (`homogeneous-in.ts:62-78`).

With the fallback removed, `pnpm vitest run packages/activerecord/src/relation.test.ts`
fails 2 real tests — "relation merging with merged joins as strings" / "as
symbols" — with `TypeError: Cannot read properties of null (reading
'typeForAttribute')`. Probed origin: table `comments`, attribute `type` (the
STI type condition), built by `reflection.ts:309`
`scope.where(typeCondition(targetKlass, table))` inside an INNER JOIN ON
clause, where `table` came from join-dependency as a bare Table.

## Construction sites to converge

Roughly 20 `new Table(...)` / `new ArelTable(...)` sites that should derive from
`klass.arelTable` (via `.alias(...)`) instead:

- `associations/join-dependency/join-association.ts:59` (`set table`)
- `associations/join-dependency.ts` (~11 sites)
- `associations/association-scope.ts` (~4 sites)
- `associations/collection-proxy.ts:3696-3697`
- `associations.ts:2881,2886`
- `relation/predicate-builder.ts` `resolveArelAttribute` (`new Table(tableName)`)

Note `TableMetadata#type` / `#typeForAttribute` (`table-metadata.ts:31-37`)
forward to `_arelTable.typeForAttribute`, so they inherit the raise. Rails'
`TableMetadata#type` does the same (`table_metadata.rb:17-19`) and is fine
precisely because its arel_table always has a caster.
`table-metadata.ts:88-89` already shows the right shape — it builds a
`TypeCaster::Connection` for the no-klass branch.

## Acceptance criteria

- [ ] Join-alias / association Arel tables carry their model's type caster,
      derived from `klass.arelTable` rather than `new Table(name)`.
- [ ] `Table#typeForAttribute` delegates bare to `typeCaster`, matching
      `table.rb:106-108`; the `// DEVIATION:` comment in `table.ts` is removed.
- [ ] `packages/activerecord/src/relation.test.ts` join-merging tests stay green
      with the fallback gone.
- [ ] Arel-side tests that drive `HomogeneousIn` off a bare table get a caster,
      mirroring Rails' `fake_pg_caster` (`homogeneous_in_test.rb:44-50`).
      Known: `arel/src/nodes/homogeneous-in.test.ts`,
      `arel/src/visitors/to-sql.test.ts` ("is not preparable"),
      `activerecord/src/relation/predicate-builder.test.ts` (bare
      `new Table("posts")` in buildFromHash / buildNegatedFromHash).
- [ ] No test name changes. api:compare / test:compare delta non-negative.
