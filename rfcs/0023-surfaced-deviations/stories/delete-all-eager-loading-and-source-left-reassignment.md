---
title: "delete_all: apply_join_dependency for eager_loading? and force arel.source.left = table"
status: claimed
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-14T21:23:15Z"
assignee: "delete-all-eager-loading-and-source-left-reassignment"
blocked-by: null
---

## Context

Surfaced in review of PR #3278 (delete-all-invalid-methods-and-always-compile).
That PR collapsed `Relation#deleteAll` onto a single `build_arel` +
`compile_delete` path for string primary keys, but left two structural
omissions from Rails `delete_all` (`relation.rb:1023-1024`):

1. **`eager_loading?` branch.** Rails does
   `arel = eager_loading? ? apply_join_dependency.arel : build_arel(c)`. The TS
   `deleteAll` always calls `_buildArel()` and never applies the join
   dependency, so a relation that requires eager loading (e.g. an `includes`
   that gets promoted to a join because the `where`/`order` references the
   association) won't have the join-dependency arel feeding `compileDelete`.

2. **`arel.source.left = table`.** Rails unconditionally forces the FROM target
   back to the bare table before `compile_delete`. The TS port omits it.
   Verified safe for the common + join cases (`_buildSelectManager` starts from
   `table.project(...)`, so `source.left` is already the table and joins land
   in `source.right`). The gap is `from(custom).deleteAll()`: an explicit
   `from()` sets `source.left` to the custom node, and without the
   reassignment the DELETE would target the custom FROM instead of the table.

## Acceptance criteria

- [ ] `deleteAll` applies the eager-load join dependency when `eager_loading?`
      is true, mirroring `relation.rb:1023`.
- [ ] `deleteAll` forces `source.left` back to the model table before
      `compileDelete`, so `from(custom).deleteAll()` still targets the table —
      matching `relation.rb:1024`.
- [ ] Tests mirror any corresponding Rails `delete_all` cases verbatim
      (`test_delete_all_with_includes`, `test_delete_all_with_left_joins`, etc.).
- [ ] CI green on all three adapters; api:compare / test:compare delta
      non-negative.
