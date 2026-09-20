---
title: "assertions-tail-root-1-rem-2"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7910
claim: "2026-09-20T17:51:54Z"
assignee: "assertions-tail-root-1-rem-2"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-tail-root-1-rem` (RFC 0132) after trails#TBD, which
converged `sanitize_test.rb` and `transaction_instrumentation_test.rb` to 0
assertion mismatches. Three files from that story's list are still open —
re-measured with `pnpm parity:test -- --package activerecord --assertions --missing`:

- `inheritance_test.rb` — 6 count + 20 kind + 1 value. Rails uses
  `assert_nothing_raised` / `assert_equal` on class names
  (`InheritanceAttributeTest::Empire` vs trails' `AttrTestEmpire`); the
  "eager load belongs to primary key quoting" test needs `assertQueriesMatch`.
- `json_serialization_test.rb` — 6 count + 17 kind. Rails asserts with
  `assert_match` against the JSON _string_ (4-8 per test); trails parses the
  JSON and compares objects with `toEqual`, so every `match` scores as `equal`.
- `query_cache_test.rb` — 7 count + 17 kind. Depends on `assertQueriesCount` /
  `assertNoQueries` / `assertClears`, which the comparer does not map to
  `assert_called` / `assert_changes`.

Learnings carried over from the parent story: `assertRaises` is
`await assertRaises([Cls], { match }, block)`; `assertSame`/`assert_same` both
fold onto `equal`; an `if current_adapter?(...)` in Rails is counted on BOTH
arms, so the TS port must keep both arms too (`currentAdapter()` from
`support/adapter-helper.js`); `expect(x.length).toBe(n)` scores `equal` while
`toHaveLength(n)` scores `length`, so a Rails `assert_equal n, xs.size` ports
as the former.

## Acceptance criteria

- Each of the three files reports 0 assertion mismatches.
- A converged test that fails on a production bug is parked `it.skip` with a
  `BLOCKED:` line and a story in RFC 0155.
