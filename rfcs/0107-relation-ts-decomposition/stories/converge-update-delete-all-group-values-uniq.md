---
title: "converge-update-delete-all-group-values-uniq"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6599
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails dedupes group values everywhere it turns them into Arel columns:

- `build_arel`: `arel.group(*arel_columns(group_values.uniq))`
  (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1759`)
- `update_all`: `group_values_arel_columns = arel_columns(group_values.uniq)`
  (`vendor/rails/activerecord/lib/active_record/relation.rb:1026`)
- `delete_all` takes the same shape a few lines below.

PR #6593 added the `.uniq` to the `build_arel` port
(`packages/activerecord/src/relation/query-methods.ts` `buildArel`), but the
update/delete arms in `relation.ts` still build their group columns without
it:

- `_execUpdateAll` — `const groupColumns = this._groupColumns.map((col) => groupColumnToArel(col, table))`
- `_execDeleteAll` — same shape

So `Post.group(:type).group(:type).updateAll(...)` emits a duplicated GROUP BY
column where Rails emits one. This asymmetry pre-dates #6593 (confirmed
against `origin/main`) and was flagged in that PR's review as a pointer for a
follow-up rather than a regression.

There is a second divergence in the same two bodies worth checking while
you are there: they use `groupColumnToArel`, while Rails uses `arel_columns`
(`query_methods.rb:1670`) — the same helper `build_arel` uses. `arelColumns`
is the ported one; `groupColumnToArel` has no Rails counterpart.

## Acceptance criteria

- `_execUpdateAll` and `_execDeleteAll` dedupe group values, matching
  `relation.rb:1026` (`arel_columns(group_values.uniq)`).
- Both build their group columns through the `arel_columns` port
  (`arelColumns`), or the `groupColumnToArel` deviation is justified at the
  call site with a Rails cite as a genuine TypeScript shortcoming.
- A test covers a duplicated `group` value through `updateAll` and
  `deleteAll`, failing on baseline.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` and `parity:test`
  deltas non-negative.
