---
title: "finder-array-conditions-composite-ambiguity"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T00:33:52Z"
assignee: "finder-array-conditions-composite-ambiguity"
blocked-by: null
closed-reason: null
---

## Context

The public `Relation#where` (packages/activerecord/src/relation.ts:640-665) and
`Base.where` (packages/activerecord/src/base.ts:2207-2234) treat **any** array
whose elements are all strings as the trails-specific composite-key form
`where(cols, tuples)`. When the array is really Rails' sanitized-conditions form
`where(["name = ?", "37signals"])` — a SQL fragment plus binds — the guard
`rest.length !== 1 || !Array.isArray(rest[0])` throws:

    ArgumentError: Relation#where(cols, tuples): composite-key form requires a
    tuples argument as an array of arrays

So `Company.where(["name = ?", "37signals"])`,
`Company.where(["name = :name", { name: "37signals" }])`,
`Company.where(["name = '%s'", "37signals!"])`, and
`Topic.where(["written_on = ?", t.written_on])` all raise instead of routing to
`buildWhereClause`, which already unwraps `[head, ...tail]` and sanitizes
correctly (query-methods.ts:937). Only the varargs string form
(`where("name = ?", x)`) and the hash form work today.

The composite-key extension is always a **two-argument** call
(`where([col1, col2], [[v1, v2], ...])`), so a single all-strings array arg
(`rest.length === 0`) should fall through to the sanitized-array path rather than
raise. This also interacts with `where-empty-array-is-null-relation` (`where([])`)
and `converge-build-where-clause-bound-sql-literal` (done, PR #3693) but is a
distinct facet: the array-fragment + binds shape.

Surfaced by faithful-port-finder-conditions-hash-time-cluster (PR TBD): the
array-form bind/interpolation tests in finder_test.rb
(test_condition_interpolation, test_condition_array_interpolation,
test_bind_variables(+\_with_quotes), test_named_bind_variables(+\_with_quotes),
test_condition_utc_time_interpolation_with_default_timezone_local,
test_condition_local_time_interpolation_with_default_timezone_utc) could not be
ported and were scoped out with a DIVERGENCE note pointing here.

trails: `packages/activerecord/src/relation.ts` (`where`),
`packages/activerecord/src/base.ts` (`where` / `whereNot`),
`packages/activerecord/src/relation/query-methods.ts:928-960` (`buildWhereClause`).
Rails: `ActiveRecord::QueryMethods#where` — an Array whose first element is a
String is `sanitize_sql(array)`, never the composite tuple form.

## Acceptance criteria

- [ ] `Model.where(["name = ?", x])` / `["name = :name", { name: x }]` /
      `["name = '%s'", x]` route through `buildWhereClause` (sanitize / BoundSqlLiteral)
      instead of raising the composite-key ArgumentError; the composite-key form
      (`where(cols, tuples)`) still requires the explicit two-argument shape.
- [ ] Whitespace between the sanitized-array form and composite form is
      disambiguated by argument count (single array arg ⇒ conditions; array + tuples
      arg ⇒ composite), matching Rails.
- [ ] Port the scoped-out finder_test.rb array-conditions tests
      (test_condition_interpolation, test_condition_array_interpolation,
      test_bind_variables, test_bind_variables_with_quotes, test_named_bind_variables,
      test_named_bind_variables_with_quotes,
      test_condition_utc_time_interpolation_with_default_timezone_local,
      test_condition_local_time_interpolation_with_default_timezone_utc) onto
      canonical Company/Firm + Topic and drop their synthetic stubs in
      packages/activerecord/src/finder.test.ts.
- [ ] api:compare / test:compare deltas non-negative.
