---
title: "assertions-calculations-contradiction-and-assert-called"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are the rows of `calculations_test.rb` left after
`assertions-calculations-test`. Each one needs runtime work:

- `pick one` / `pick two` (`calculations_test.rb:1352-1370`) assert no query
  for `Topic.where(id: 9999999999999999999).pick(...)`. Rails'
  `WhereClause#contradiction?` (`relation/where_clause.rb:99-108`) checks
  `x.right.respond_to?(:unboundable?) && x.right.unboundable?`. trails'
  `isContradiction` (`packages/activerecord/src/relation/where-clause.ts:107`)
  reads a non-existent `unboundable` property, so it is never true for an
  out-of-range bind. Porting it with `rbObjRespondTo(right, "isUnboundable")`
  was tried and reverted: `Arel::Predications`' private `unboundable?(value)`
  (`packages/arel/src/predications.ts:469`) is visible on every `Nodes.Casted`,
  so `where(x: nil)` turned into `1=0` (finder/where-chain tests went red).
- `count takes attribute type precedence over database type` and
  `sum takes attribute type precedence over database type`
  (`calculations_test.rb:1447-1467`) use `assert_called(connection,
:select_all, returns: ...)`. activesupport's `assertCalled`
  (`packages/activesupport/src/testing/method-call-assertions.ts:15`) takes a
  synchronous block, so it restores the stub before the async count reaches
  `select_all`.
- `pluck type cast` (`calculations_test.rb:873-883`): the fourth assertion,
  `pluck("min(written_on)", "min(replies_count)")`, returns the raw string on
  SQLite in trails. Check how Rails casts it (SQLite `stmt.types` is nil for
  expressions) before porting it.

## Acceptance criteria

- `WhereClause#isContradiction` matches Rails without treating
  `Predications#isUnboundable` as the public `unboundable?`.
- The async-capable `assert_called` shape exists, and the two type-precedence
  tests mirror Rails.
- `calculations_test.rb` reports 0 count/kind/value mismatches, apart from the
  rows owned by `sqlite3-perform-query-positional-result`.
