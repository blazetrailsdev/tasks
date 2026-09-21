---
title: "assertions-named-scoping"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7934
claim: "2026-09-21T17:16:02Z"
assignee: "assertions-named-scoping"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-relation-named-scoping-relation-scoping` (RFC 0132). That story
converged `relation_test.rb` and `scoping/relation_scoping_test.rb` to 0 assertion
mismatches; `scoping/named_scoping_test.rb` was left for its own PR because the parent PR
was already near its LOC ceiling.

Re-measure with `pnpm parity:test -- --package activerecord --assertions --missing`.

- Rails: `vendor/rails/activerecord/test/cases/scoping/named_scoping_test.rb` (48 tests).
- trails: `packages/activerecord/src/scoping/named-scoping.test.ts`.

At the time of filing, ~48 tests report a kind mismatch. The recurring shapes:

- `assert_not_empty x` ported as `expect(x.length).toBeGreaterThan(0)` — the `operator`
  vs `notEmpty` rows. Use `assertNotEmpty` from `@blazetrails/activesupport`.
- `assert_equal n, x` ported as `expect(x).toBeTruthy()` and vice versa — read the Rails
  line and port the kind it actually uses.
- `assert_respond_to` / `assert_not_respond_to` ported as `expect(typeof x.m).toBe(...)`.
  Use `assertRespondTo` / `assertNotRespondTo`; note the parent PR made the helper
  dispatch to an object's own `respondTo`, as Ruby's `respond_to?` does.
- `assert_queries_count` / `assert_no_queries` / `assert_queries_match` are unmapped on
  BOTH sides, so port them to `assertQueriesCount` / `assertNoQueries` /
  `assertQueriesMatch` from `packages/activerecord/src/testing/query-assertions.ts`
  rather than to a bare `expect(queries.length).toBe(n)`, which scores an extra `equal`.
- `assert_nothing_raised` -> `assertNothingRaised`.

Idioms settled by the parent PRs, reuse them rather than re-deriving:

- `assert_difference` / `assert_no_difference` -> `assertDifference` / `assertNoDifference`.
- `error = assert_raises X ...; assert_match m, error.message` ->
  `const error = await assertRaises([X], {}, () => ...); expect(error.message).toMatch(m)`.
- `assert_predicate x, :present?` -> `expect(isPresent(x)).toBeTruthy()`.

## Acceptance criteria

- `scoping/named_scoping_test.rb` reports 0 assertion mismatches.
- No test renames. Do not reseed the assertion mark file.
- A trails-only extra assertion in a matched test moves to
  `packages/activerecord/src/scoping/named-scoping.trails.test.ts` rather than being deleted
  outright, when it carries real coverage.
