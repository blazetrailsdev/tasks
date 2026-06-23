---
title: "where(col: []) should be a null relation (no WHERE 1=0 query)"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 40
pr: null
claim: "2026-06-23T02:43:16Z"
assignee: "where-empty-array-is-null-relation"
blocked-by: null
---

## Context

Rails treats `Model.where(col: [])` as a contradiction / null relation: the
relation's `where_clause.contradiction?` is true, so `pluck`/`load`/`count` return
empty **without issuing a query**. trails instead emits a real
`SELECT ... WHERE 1=0`.

Surfaced in PR #3409 (RFC 0030 a3-has-one-and-through): the has_one :through
disable_joins loader emitted an extra `WHERE 1=0` SELECT on an empty chain. That was
worked around locally in `disable-joins-association-scope.ts` by calling `.none()`
when the plucked id set is empty (both intermediate steps and the tail). The general
fix is to make `where({col: []})` produce a null relation at the Relation level so
every caller (not just disable_joins) skips the impossible query, matching Rails.

Refs:

- trails: `packages/activerecord/src/relation/query-methods.ts` (where / `_isNone`),
  `relation/finder-methods.ts:323` (none short-circuit), and the local workaround in
  `packages/activerecord/src/associations/disable-joins-association-scope.ts`.
- Rails: `ActiveRecord::Relation::WhereClause#contradiction?`,
  `QueryMethods#where` empty-array handling.

## Acceptance criteria

- [ ] `Model.where(col: [])` (and hash/array predicate forms that reduce to an empty
      IN) yields a null relation that returns empty for load/pluck/count/exists
      without a DB query, matching Rails.
- [ ] The disable_joins-local `.none()` workaround in
      `disable-joins-association-scope.ts` can be removed (or simplified) once the
      general behavior lands, with the has_one :through disable_joins query-count tests
      still green.
- [ ] No regressions in existing relation/where tests.
