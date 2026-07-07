---
title: "where(['sql = ?', bind]) all-string array misrouted to composite-key form"
status: done
updated: 2026-07-07
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 13
pr: 4457
claim: "2026-07-07T15:01:53Z"
assignee: "where-all-string-array-conditions-vs-composite-key"
blocked-by: null
closed-reason: null
---

## Context

`Base.where` (packages/activerecord/src/base.ts:2224) and `Relation#where`
(packages/activerecord/src/relation.ts:649) guard the composite-key tuple form
with `Array.isArray(x) && x.every((c) => typeof c === "string")`. This conflates
two distinct Rails call shapes:

- composite-key form: `where([cols], [tuples])` — two args, first is an
  all-string array of column names.
- classic array-conditions form: `where(["name = ?", "David"])` — a single
  array whose head is an SQL fragment and whose tail are binds.

When every element is a string (e.g. `where(["name = ?", "David"])`), trails
routes to the composite-key branch and throws "composite-key form requires a
tuples argument as an array of arrays", whereas Rails' `build_where_clause`
(vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1613-1618)
unwraps it as `opts="name = ?", rest=["David"]` — the string-fragment path.

Surfaced while porting build-where-clause-array-unwrap-rest-overwrite (PR #4462):
the mixed-type case `where(["id = ?", 1])` works (the number defeats the
all-string guard and falls through to `buildWhereClause`'s array unwrap), but the
all-string fragment case is unreachable through the public API and even the typed
overloads reject an array first arg (the test needed a `(where as any)` cast).

## Acceptance criteria

- [ ] `where(["name = ?", "David"])` (single array, string head + binds) routes
      to the SQL-fragment path and binds correctly, matching Rails.
- [ ] Composite-key form `where([cols], [tuples])` still works (disambiguate by
      arity / second-arg-is-array-of-arrays, not by all-string head).
- [ ] Public `where` overloads accept the array-conditions first-arg shape so no
      `as any` cast is needed at call sites.
- [ ] Test exercises the all-string array-conditions form; test names match Rails.
