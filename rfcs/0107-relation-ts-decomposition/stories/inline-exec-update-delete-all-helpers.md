---
title: "Inline _execUpdateAll/_execDeleteAll back into updateAll/deleteAll (relation.rb:606,:1023)"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6599
claim: "2026-08-16T15:15:06Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

`relation.rb` inlines the statement build directly in `update_all` and
`delete_all`:

- `update_all` (`vendor/rails/activerecord/lib/active_record/relation.rb:588-620`),
  body at `:606-616`:

  ```ruby
  arel = eager_loading? ? apply_join_dependency.arel : build_arel(c)
  arel.source.left = table
  group_values_arel_columns = arel_columns(group_values.uniq)
  stmt = arel.compile_update(values, key, having_clause_ast, group_values_arel_columns)
  ```

- `delete_all` (`:1011-1035`), same shape at `:1023-1033` with `compile_delete`.

trails extracts both bodies into private helpers — `_execUpdateAll` and
`_execDeleteAll` in `packages/activerecord/src/relation.ts` — which Rails does
not have. CLAUDE.md's Decomposition rule ("If Rails inlines something, inline
it. One Rails method is one TS method") forbids the split.

This is not only a shape issue: it is measurably load-bearing. The call-set
gate reads only the outer `updateAll`/`deleteAll` body, so every call the
helper makes is invisible to it. PR #6597 (fan-out-calculations-from-relation)
moved `pluck`/`ids` out of `relation.ts`, taking the file's last `arel()` /
`arelColumns(...)` call sites with them, and four mismatch rows immediately
surfaced that had been masked all along:

```text
activerecord  relation.ts  update_all  arel
activerecord  relation.ts  update_all  arel_columns
activerecord  relation.ts  delete_all  arel
activerecord  relation.ts  delete_all  arel_columns
```

They are baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` with
that reason and are debt, not permission.

Two spelling divergences sit inside the helpers and are what the rows are
actually reporting:

- `this.applyJoinDependency()._buildArel()` where Rails calls
  `apply_join_dependency.arel` — trails' `arel()` is just
  `_buildArel(aliases)` with `aliases` undefined, so this converges by
  spelling.
- `this._groupColumns.map((col) => groupColumnToArel(col, table))` where Rails
  calls `arel_columns(group_values.uniq)`.

## Acceptance criteria

- [ ] `_execUpdateAll` and `_execDeleteAll` are inlined into `updateAll` /
      `deleteAll`; the two helpers no longer exist.
- [ ] The inlined bodies call `arel()` and `arelColumns(...)` where
      `relation.rb:606-616` / `:1023-1033` do.
- [ ] The four `update_all`/`delete_all` × `arel`/`arel_columns` rows are
      DELETED from
      `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
      (only-shrink; delete by hand, do not reseed), and the shard's
      unreviewed high-water mark is tightened with
      `pnpm parity:api:calls:tighten activerecord/relation.json`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new rows.
- [ ] Coordinate with `converge-update-delete-all-group-values-uniq`, which
      adds the missing `.uniq` to the same two group-column expressions — if
      that story lands first, this one inherits its `.uniq`; if this lands
      first, it should carry the `.uniq` since `arel_columns(group_values.uniq)`
      is the converged shape either way.
