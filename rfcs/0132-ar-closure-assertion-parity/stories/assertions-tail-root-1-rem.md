---
title: "assertions-tail-root-1-rem"
status: ready
updated: 2026-09-19
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

Remainder of assertions-tail-root-1 (RFC 0132). trails#7880 converged relation/where_chain_test.rb and serialized_attribute_test.rb to 0/0/0.

Files still with assertion mismatches under vendor/rails/activerecord/test/cases/, re-measured after #7880 (`pnpm parity:test -- --package activerecord --assertions --missing`):

- sanitize_test.rb: 24 tests. Rails asserts 4-12 assert_equal per test (bind enumerable: 12); the trails file builds bespoke Post classes and asserts on SQL strings, so it needs a rewrite on the canonical models. named bind arity and literal colons also need assert_raises ported.
- inheritance_test.rb: 22 tests. assert_nothing_raised / assert_equal on class names (InheritanceAttributeTest::Empire vs trails AttrTestEmpire); eager load belongs to primary key quoting needs assert_queries_match.
- json_serialization_test.rb: 20 tests. Rails uses assert_match on JSON strings (4-8 per test); trails compares parsed objects.
- transaction_instrumentation_test.rb: 25 tests. Rails asserts equalities on collected events; trails asserts lengths.
- query_cache_test.rb: 22 tests. Depends on assertQueriesCount / assertNoQueries / assertClears, which the comparer does not map to assert_called / assert_changes.

Learnings: `assert_raises` + `assert_match e.message` ports as `const e = await run().then(() => undefined, (err) => err); expect(() => { throw e; }).toThrow(Cls); expect(e.message).toMatch(re)`; `assert_includes` is `toContainEqual`; `assert_predicate x, :any?` is `expect(await rel.isAny()).toBeTruthy()`; where_clause equality uses `whereClause.plus(...).invert()`. Construct with `new Model(...)` before an asserted `save`, never `create` then `save`.

## Acceptance criteria

- Each listed file reports 0 assertion mismatches; a converged test that fails on a production bug is parked it.skip with a BLOCKED: line and a story in 0155.
