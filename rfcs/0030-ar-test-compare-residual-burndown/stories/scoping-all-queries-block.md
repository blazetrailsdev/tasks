---
title: "Relation#scoping(all_queries:) block-form parity"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: relation-scoping
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b1-relation-scoping (PR #3413). The block form
`Relation#scoping` (relation.ts:5463, base.ts:1766) takes only a callback and
threads no `all_queries` flag, so a default scope flagged `all_queries: true`
cannot be opted into for non-SELECT queries inside a scoping block.

Rails: `ActiveRecord::Relation#scoping(all_queries: nil, &block)` — sets
`klass.current_scope(self, all_queries)` and raises ArgumentError
("Scoping is set to apply to all queries and cannot be unset in a nested block.")
when a nested block passes `all_queries: false`.

Blocks these relation_scoping_test.rb cases (currently it.skip in
scoping/relation-scoping.test.ts):

- `scoping applies to reload with all queries`
- `raises error if all queries is set to false while nested`
- `scoping applies to all queries on has many when set`

## Acceptance criteria

- `Relation#scoping({ allQueries })` and `Base.scoping(rel, { allQueries }, fn)`
  thread the flag into the ScopeRegistry current scope.
- Nested `allQueries: false` inside an `allQueries: true` block raises the
  Rails ArgumentError with the same message.
- Un-skip the three cases above in scoping/relation-scoping.test.ts.
