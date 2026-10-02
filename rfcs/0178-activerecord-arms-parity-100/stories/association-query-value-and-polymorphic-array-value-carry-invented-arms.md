---
title: "activerecord: AssociationQueryValue and PolymorphicArrayValue carry arms Rails does not have"
status: draft
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing `relation/predicate-builder/` for trails PR 8392. That PR converged only the
`empty?` receipts in these two files; the rest of each body still diverges from Rails.

**`AssociationQueryValue`**
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder/association_query_value.rb`):

- `queries` (`:10-19`) has two arms. For an Array `join_foreign_key` it is
  `id_list = ids`, `id_list = id_list.pluck(primary_key) if id_list.is_a?(Relation)`, then
  `id_list.map { |ids_set| associated_table.join_foreign_key.zip(ids_set).to_h }`.
  `packages/activerecord/src/relation/predicate-builder/association-query-value.ts` `queries` instead
  builds a `reselect` relation per foreign-key column for the Relation case, and raises two invented
  `Error`s ("Composite foreign key association requires tuple values…", "Composite FK tuple arity
  mismatch…") that Rails does not have. ruby-compat now exports `zip` and `toH`, so the map is
  `toH(zip(fk, idsSet))`.
- `convert_to_id` (`:56-70`) reads `value.id_value` for the `"id"` attribute and `value.public_send(attribute)`
  otherwise, and its scalar arm is `value.respond_to?(primary_key) ? value.public_send(primary_key) : value`.
  The TS `convertToId` probes `readAttribute`, `pk in value` and an invented `"id" in value` fallback.
- `primary_key` (`:39-41`) is `associated_table.join_primary_key`; the TS adds `?? "id"`.
- `polymorphic_clause?` (`:52-54`) is `primary_type && !value.where_values_hash.has_key?(primary_type)`;
  the TS probes `typeof value.whereValuesHash === "function"` and answers `true` when it is absent.
- `ids`' `relation.select(primary_key)` (`:27`) is ported with an `arelTable.get(pk)` wrapper and an
  `!Array.isArray(pk)` guard Rails does not have.

**`PolymorphicArrayValue`** (`…/predicate_builder/polymorphic_array_value.rb`):

- `queries` (`:10-19`) is a single `type_to_ids_mapping.map` building
  `query[join_foreign_type] = type if type; query[join_foreign_key] = ids`. The TS `queries` adds a
  whole composite-foreign-key arm (per-tuple queries, an `ArgumentError`, `tuple[i] ?? null`) and
  unwraps a one-element `ids` (`ids.length === 1 ? ids[0] : ids`).
- `klass` (`:34-40`) is `value.is_a?(Base)` / `value.is_a?(Relation)`; the TS duck-types on
  `"_model" in value && "arel" in value` and falls back to `value.constructor`.
- `convert_to_id` (`:42-54`) reads `value._read_attribute(primary_key)` for a `Base`; the TS reads
  `value[pk]` behind `pk in value`.

The `pluck` in `queries` runs a query, which is async in trails. CLAUDE.md § "`Relation` is evaluated
by an async query" names `DeferredPluck` as the settled carrier for a pluck reached from a
synchronous predicate body, and `PredicateBuilder#expandFromHash` already parks one as a
`DeferredIdsIn`.

## Acceptance criteria

- [ ] `AssociationQueryValue#queries`, `ids`, `primaryKey`, `isPolymorphicClause` and `convertToId` have Rails' arms and no others; the two invented `Error`s are gone; the composite Relation arm goes through `pluck(primary_key)` (as a `DeferredPluck` where the body is synchronous).
- [ ] `PolymorphicArrayValue#queries`, `klass` and `convertToId` have Rails' arms and no others. If the composite-foreign-key arm is load-bearing for a Rails-named test, name the test and the Rails path that serves it in the PR body rather than keeping the arm silently.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:report` show no new row for either file, with no baseline row or receipt added.

## Verification

```bash
pnpm vitest run packages/activerecord/src/relation/predicate-builder.test.ts packages/activerecord/src/relation/composite-where.trails.test.ts packages/activerecord/src/relation/where.test.ts packages/activerecord/src/associations/belongs-to-associations.test.ts
pnpm parity:api:calls && pnpm parity:api:calls:args
```
