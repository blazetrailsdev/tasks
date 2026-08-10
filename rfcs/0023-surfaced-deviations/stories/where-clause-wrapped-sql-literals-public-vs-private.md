---
title: "WhereClause#predicates_with_wrapped_sql_literals is public in trails, private in Rails"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a behavioral divergence from Rails: predicatesWithWrappedSqlLiterals (where-clause.ts:215) produces identical SQL; only TS visibility differs, and the deviation is already justified inline. Member visibility is not a Rails-fidelity axis parity:api scores."
---

## Context

`where_clause.rb:187` keeps `predicates_with_wrapped_sql_literals` in the
`private` section. In trails it is public on `WhereClause`
(`packages/activerecord/src/relation/where-clause.ts`), because `relation.ts`
calls it directly from four sites that build a WHERE list for an
`UpdateManager` / `DeleteManager` or compare predicate SQL:
`_whereClauseToSql`, the update-all fallback, the delete-all fallback, and
`_collectAllWhereNodes`.

Rails does not need this: those paths go through `Arel` builders that consume
`where_clause.ast`, which is public and does the wrapping internally. The
deviation is currently justified inline at the declaration (PR #5340).

## Acceptance criteria

- Either the four `relation.ts` call sites are converged onto public
  `WhereClause` surface Rails actually exposes (most likely `ast`, matching how
  Rails' own update/delete managers consume it), and the method returns to
  `private`; or the deviation is confirmed unavoidable and the inline
  justification is upgraded to name this story's finding.
- No SQL changes: `relation.test.ts` and `where-clause.test.ts` pass untouched.
