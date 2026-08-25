---
title: "Burn down the 26 naming call-argument rows in persistence, relation and query-methods"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 104
pr: 6513
claim: "2026-08-14T11:47:18Z"
assignee: "naming-burndown-3-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 3. Measured on `origin/main` at **059bfe688** (2026-08-12) with
`API_COMPARE_ALLOW_STALE_BUILD=1 API_COMPARE_FORCE=1 pnpm parity:api --calls`
followed by `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`
(the freshness guard reports `OutOfDateWithSelf` for activerecord/activesupport
even after a clean `pnpm build`, so the stale-build escape hatch is required).

That run reports **344 `naming` rows** repo-wide, of which **167** are in RFC
0096's scope (the RFC's `## Scope` drops actiondispatch/rack/actionview/
actioncontroller — 177 rows). Wave 3 cuts the 167 into six slots; this is the
persistence + relation slot: **26 rows across 9 files**.

| Rows | File                                                      |
| ---: | --------------------------------------------------------- |
|    8 | `packages/activerecord/src/persistence.ts`                |
|    6 | `packages/activerecord/src/relation/query-methods.ts`     |
|    2 | `packages/activerecord/src/insert-all.ts`                 |
|    2 | `packages/activerecord/src/relation.ts`                   |
|    2 | `packages/activerecord/src/relation/batches.ts`           |
|    2 | `packages/activerecord/src/relation/finder-methods.ts`    |
|    2 | `packages/activerecord/src/relation/predicate-builder.ts` |
|    1 | `packages/activerecord/src/relation/merger.ts`            |
|    1 | `packages/activerecord/src/statement-cache.ts`            |

### Representative rows, with both sides

- **`persistence.ts#_insertRecord` / `#_deleteRecord`** —
  `packages/activerecord/src/persistence.ts:259` and `:327`/`:358` bind
  `const table: ArelTable = ctor.arelTable` and pass `table`. Rails
  (`vendor/rails/activerecord/lib/active_record/persistence.rb:254`, `:274`)
  has no such local — it calls `arel_table[name]` inline, so the recorded Ruby
  arg is `arel_table`. Either name the local `arelTable` or inline it as Rails
  does.
- **`persistence.ts#update` / `#update!`** — TS parameter is `attrs`, Rails
  (`persistence.rb`, `assign_attributes(attributes)`) is `attributes`.
- **`persistence.ts#updateColumns`** — TS `key`, Rails `k`
  (`clear_attribute_change(k)`). Rename to `k`; the Rails identifier wins even
  when it is a single letter.
- **`persistence.ts#_queryConstraintsHash`** — TS `col`, Rails `column_name`
  (`attribute_in_database(column_name)`).
- **`relation/finder-methods.ts#findSome` / `#findSomeOrdered`** — TS passes
  `ids.length`, Rails (`relation/finder_methods.rb`) passes `ids.size` into
  `raise_record_not_found_exception!`. This is the `size`→`length` translation,
  a _tooling_ recording (`ref:size` vs `ref:length`), not a rename — it cannot
  be converged and belongs in the baseline at the gate flip.
- **`relation/merger.ts#mergeClauses`** — TS passes `_havingClause` where Rails
  passes `where_clause` (`relation/merger.rb`). Read this one before renaming:
  a wrong clause here is a correctness bug, not a naming one, and if it is
  genuinely the having clause it is an a1/a3 finding to file.
- **`relation/query-methods.ts#buildWithValueFromHash`** — Ruby
  `[build_with_expression_from_value(value), name]`, TS `[name, expr]`. That is
  an **argument-order (a1) finding**, not a rename. File it; do not reorder
  blind.

### Tooling residue in this slot

Sampled all 26: roughly **6** are tooling shapes rather than renames —
`ids.size`→`ids.length` (2 rows in finder-methods), `relation.ts#touchAll`
passing `ref:call` against Ruby `touch_attributes_with_time` (a nested call
recorded as a `ref:`), `predicate-builder.ts#groupingQueries` recording
`ref:constructor` / `ref:reduced` against Ruby `queries`, and
`query-methods.ts#flattenedArgs` (`ref:e` vs `ref:toA`). Classify each in the
PR body so `naming-gate-flip` can baseline them with a reviewed reason.

### How to converge

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `k`, the TS name is `k`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by **at least 18 of these 26 rows**, and no new
      `shape` rows.
- [ ] The `buildWithValueFromHash` argument-order divergence and the
      `mergeClauses` clause mismatch are each either converged or filed as a
      story, with the Rails `file:line`, and named in the PR body.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] `pnpm lint` passes and the activerecord persistence/relation tests pass on
      all three adapters; no public API change.

## Progress — PR #6459 (partial; story NOT closed)

PR #6459 converged **9 of this slot's 26 rows** (26 -> 17), short of the >=18 in
the acceptance criteria. Converged: `persistence.ts` 8 -> 2 (`attrs` ->
`attributes`, `key` -> `k`, `col` -> `column_name`, `table` -> `arel_table`,
`_find_record` inlining `_in_memory_query_constraints_hash`),
`relation/query-methods.ts` 6 -> 5 (`build_where_clause` rebinds `opts`),
`insert-all.ts` 2 -> 1 (`unique_indexes` reads `model.table_name`),
`relation/predicate-builder.ts` 2 -> 1 (`grouping_queries` names the reduced
array `queries`).

**The >=18 target is not reachable by renaming.** The story estimated ~6
residue rows; inspection of all 17 survivors found ~15 unconvergeable:

- `.size` -> `.length` (4: `finder-methods.ts` x2 recorded twice each).
- Nested-call-vs-local recordings: `relation.ts#touch_all`,
  `persistence.ts#becomes` (`instance_variable_get`),
  `persistence.ts#_find_record` (now `ref:call`, the module-mixin `.call(this)`),
  `query-methods.ts#flattened_args` (`to_a`), `#build_join_buckets`
  (`Arel.sql` is imported as `arelSql` to dodge a collision),
  `#build_cast_value` (`Type.default_value` vs `new ValueType()`),
  `batches.ts` x2 (Ruby `Array(start)` conversion).
- Module-mixin receiver passing: `relation.ts#find_by_token_for`,
  `insert-all.ts#to_sql` — now tracked by
  `module-mixin-receiver-this-typed`.
- a3/a1 filed separately: `build-with-value-from-hash-arg-order`,
  `merge-clauses-where-clause-structure`.
- `query-methods.ts#arel_column_with_table` — `colStr` cannot become
  `column_name` because the later `typeof columnName === "symbol"` branch needs
  the pre-narrowed value. That branch is itself suspect: per CLAUDE.md a Ruby
  Symbol is a JS string in trails, so the `symbol` arm may be a deeper
  divergence worth its own story.
- `statement-cache.ts#create` — trails has a `cacheableQuery`-absent fallback
  branch Rails does not, and the row is recorded against it.

## Threshold correction (`naming-residue-taxonomy-recalibration`, 2026-08-13)

The `>=18` above was written against the pre-recalibration assumption that
~6% of the class is unconvergeable tooling residue. The committed classifier
(`scripts/api-compare/naming-taxonomy.ts`, reported by `pnpm
parity:api:calls:args:report`) measures this slot at **17 convergeable rows
and 2 permanent** ones, so the reachable target is **17**, not
`>=18`. Read the acceptance criterion as that number.

Permanent here means the classifier's `js-reserved-word`, `no-js-equivalent` and
`conventions-rename` classes — each carries ONE shared reviewed reason at the
gate flip, not a per-row sentence. `module-mixin-receiver` and `burndown` rows
are NOT permanent and must never be baselined, whatever this slot leaves
standing. See RFC 0096 `## Residue taxonomy`.
