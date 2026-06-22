---
title: "Relation#where raw ? fragments should bind, not inline (PG type-cast parity)"
status: claimed
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: "2026-06-22T14:59:58Z"
assignee: "relation-raw-fragment-bind-parameterization"
blocked-by: null
---

## Context

`Relation#where("col = ?", value)` inlines the raw `?` fragment value
directly into the executed SQL, whereas Rails binds it as a parameter
(`$1` on PG / `?` on the driver) at execution time, letting the database
cast the value against the column type.

Surfaced by `adapters/postgresql/bind-parameter.test.ts` (RFC 0019
canonical-burndown, PR #3551): Rails'
`BindParameterTest#assert_quoted_as` does
`Post.where("title = ?", value)` then `assert_empty relation.to_a` for
type-mismatched values (integer/float/boolean/decimal/rational against
the varchar `title`). In trails the inlined `WHERE (title = 0)` raises
PG `42883 operator does not exist: character varying = integer` instead
of returning empty, because the literal is spliced in rather than bound.

trails source: `relation` raw-string `where` fragment substitution
(see `Post.where("title = ?", value).toSql()` vs execution path).
Rails: `activerecord/lib/active_record/sanitization.rb`
`replace_bind_variables` → bind params, not inline quoting at execution.

The bind-parameter test currently asserts the rendered SQL for all six
cases (which matches Rails verbatim) and only executes the row query for
the matching string case, with an inline DIVERGENCE note pointing here.

## Acceptance criteria

- [ ] `Relation#where("col = ?", value)` binds `?` as a parameter at
      execution so a type-mismatched comparison casts against the column
      type (matching Rails) rather than splicing an inline literal.
- [ ] Re-enable the omitted row assertions in
      `adapters/postgresql/bind-parameter.test.ts` (assert
      `relation.toArray()` empty for the integer/float/boolean/decimal/
      rational cases) and drop the inline DIVERGENCE note.
- [ ] No regression in `Relation#where` SQL-text rendering (to_sql still
      shows the inlined literal for display parity with Rails).
