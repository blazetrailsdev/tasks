---
title: "converge-relation-table-attr-reader-reads"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `converge-relation-subfile-model-accessor-reads` (#5325), which
routed `model`/`klass` reads through the accessor and explicitly left
`arelTable` reads alone. This story picks up that remainder — and it is NOT
merely a call-graph fix.

Rails reads the `table` attr_reader (relation.rb:71) in `arel_column`,
`build_select`, `preprocess_order_args`, `find_some`, `find_some_ordered`,
`construct_join_dependency`, `build_with_join_node`, `batch_condition`,
`delete_all`, `update_all` and friends. trails instead reads
`this._modelClass.arelTable` in the `relation/` subfiles, which bypasses
`Relation#table`:

    // packages/activerecord/src/relation.ts:6233
    get table(): Table {
      return this._table ?? this._modelClass.arelTable;
    }

`_table` is live and reachable, not vestigial: the constructor accepts a
`table?: Table | Nodes.TableAlias` and stores it (relation.ts:509, 513-524,
mirroring Rails' `Relation.create(model, table: arel_table.alias(...))`), and
it is propagated on clone (relation.ts:6940) and consulted when building an
unscoped baseline (relation.ts:6490). So for any relation built on an aliased
table, every subfile read of `_modelClass.arelTable` resolves to the model's
DEFAULT table instead of the alias — a wrong-table divergence, not just a
missing call.

19 wide-ratchet `table` entries corroborate the scope:
`relation.ts` (9), `relation/query-methods.ts` (7),
`relation/finder-methods.ts` (3) — see
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/`.

## Acceptance criteria

- Each `_modelClass.arelTable` read in `packages/activerecord/src/relation/`
  is checked against its Rails counterpart body; those whose Rails body reads
  the `table` attr_reader are routed through `this.table`. Reads with no Rails
  counterpart, or whose Rails body genuinely reaches for the model's own
  `arel_table`, are left alone and noted in the PR body.
- Add a regression test that FAILS on baseline: build a relation on an aliased
  table (constructor `table:` with `arelTable.alias(...)`) and assert the
  emitted SQL qualifies against the ALIAS, not the base table, on at least one
  affected path (e.g. `arel_column` / order / find_some select).
- Reseed with `pnpm api:calls:wide:reseed`; `pnpm api:calls:wide` stays green
  and the baseline does not grow.
- 500 LOC ceiling; split by file if needed (query-methods / finder-methods /
  relation.ts are natural seams).

Hard rules: no `node:*` imports; no `process.*`; async fs only; no new
third-party runtime deps; no stacked PRs; test names match Rails verbatim.
