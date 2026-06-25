---
title: "Finder not-found messages include the Rails where_sql conditions clause"
status: claimed
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-25T11:49:31Z"
assignee: "finder-not-found-where-conditions-clause-fidelity"
blocked-by: null
---

## Context

Rails appends a `conditions` clause to every not-found message when the relation
has a non-empty where clause:
`conditions = " [#{arel.where_sql(model)}]" unless where_clause.empty?`
(`finder_methods.rb:418`), appended in all three branches of
`raise_record_not_found_exception!` (lines 424, 427, 431). e.g.
`test_find_on_relation` (`finder_test.rb:1808`) asserts
`"Couldn't find Post with [WHERE (1 = 0)]"`.

trails omits this clause entirely — there is no `where_sql` equivalent, so
`raiseRecordNotFoundExceptionBang`, `raiseNotFoundSingle`, and `raiseNotFoundAll`
(`relation/finder-methods.ts`) all produce the message without the `[WHERE …]`
suffix. Documented as a known omission in the builder comment by PR #4098.

## Acceptance criteria

- Not-found messages from finders on a scoped relation include the
  the `[WHERE …]` conditions clause matching Rails byte-for-byte (build the SQL via the
  relation's arel/where clause; needs a `whereSql`-equivalent).
- Test mirroring `test_find_on_relation` (read it first), asserting the bracketed
  WHERE clause in the message.
