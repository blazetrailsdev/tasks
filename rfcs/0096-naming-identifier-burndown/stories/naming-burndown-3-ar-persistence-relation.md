---
title: "Burn down the 26 naming call-argument rows in persistence, relation and query-methods"
status: ready
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 104
priority: 21
pr: null
claim: null
assignee: null
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
