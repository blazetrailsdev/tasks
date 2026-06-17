---
title: "eager-load-extra-select-projection"
status: in-progress
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3520
claim: "2026-06-17T01:46:26Z"
assignee: "eager-load-extra-select-projection"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story `b3-relation-select-joins` while un-skipping
`relation/select_test.rb` cases. Two select projections are discarded under
eager loading because the JoinDependency builds its own `t0_r*` column list and
ignores the relation's explicit `select`:

- `relation/select.test.ts` → `type casted extra select with eager loading`
  (Rails `test_type_casted_extra_select_with_eager_loading`): left `it.skip` with
  a BLOCKED tag. `Post.select("posts.id * 1.1 AS foo").eagerLoad("comments")`
  should hydrate `foo` (= 1.1) onto the base record; it currently reads `null`.
- `relation/select.test.ts` → `non select columns wont be loaded`: the third Rails
  assertion (`posts.eager_load(:comments).first`) is omitted for the same reason —
  the custom `UPPER(title) AS title` base-table select is dropped, so `body` loads
  and never raises `MissingAttributeError`.

Rails: `activerecord/test/cases/relation/select_test.rb`
(`test_type_casted_extra_select_with_eager_loading`,
`test_non_select_columns_wont_be_loaded`).

trails: `packages/activerecord/src/associations/join-dependency.ts`
(projection/`aliasedColumnNames` + row hydration),
`packages/activerecord/src/relation.ts` `_buildEagerJoinManager`.

## Acceptance criteria

- [ ] Under eager loading, a relation's explicit `select`/extra-select columns are
      preserved on the base table's projection and hydrated onto the base record
      (type-cast applied), instead of being replaced by the JoinDependency's
      `t0_r*` column list.
- [ ] Un-skip `type casted extra select with eager loading` and restore the
      omitted `eager_load(:comments)` assertion in `non select columns wont be
loaded`; both pass against canonical SQLite (and PG/MySQL per the ruby gate).
- [ ] No regressions in eager-load column projection / hydration tests.
