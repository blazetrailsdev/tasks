---
title: "assert_no_queries / assert_queries_count are unmapped, so the kind gate cannot tell them apart"
status: draft
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/assertion-kinds.ts` maps a Rails assertion name and a
trails matcher onto a shared canonical kind, and reports anything it cannot map
as `unmapped` — informational, not diffed. The query-count assertion family is
entirely unmapped on both sides:

- Rails `assert_no_queries`, `assert_queries_count`, `assert_queries_match`,
  `assert_no_queries_match` are in neither `RAILS_MAP` nor an alias table.
- trails' `assertNoQueries` / `assertQueriesCount` / `assertQueriesMatch` /
  `assertNoQueriesMatch` (`packages/activerecord/src/testing/query-assertions.ts`)
  reach `normalizeTrailsKind`'s `/^(assert|refute|must|wont|expect)/` fallback,
  which snake-cases them and hands them to `normalizeRailsKind` — which also
  has no entry, so they come back `null`.

Both sides unmapped means the COUNT still matches, which is how trails#7897
took `connection_adapters/schema_cache_test.rb` to 0 mismatches with six
`assert_no_queries` blocks in it. But the KIND histogram cannot tell the family
apart: a trails `assertNoQueries` scored against a Rails `assert_queries_count(1)`
is green, and so is `assertQueriesCount` against `assert_no_queries` — the exact
inversion (asserting no query ran where Rails asserts one did) the assertion
ratchet exists to catch. The `[unmapped: rails:assert_no_queries]` note printed
beside a mismatch line is the only trace.

Rails' definitions:
`vendor/rails/activerecord/test/cases/helper.rb` →
`ActiveRecord::Assertions::QueryAssertions`
(`vendor/rails/activerecord/lib/active_record/testing/query_assertions.rb:22`
`assert_queries_count`, `:47` `assert_no_queries`, `:66` `assert_queries_match`,
`:94` `assert_no_queries_match`).

## Converged shape

Give the family its own canonical kinds in `assertion-kinds.ts`, so the two
sides are compared rather than both discarded:

- Add `queriesCount` and `queriesMatch` to `CanonicalKind`.
- `RAILS_MAP`: `assert_queries_count` → `queriesCount`,
  `assert_no_queries` → `queriesCount`, `assert_queries_match` →
  `queriesMatch`, `assert_no_queries_match` → `queriesMatch`. The trails
  helpers then resolve through the existing `assert*` fallback with no
  `TRAILS_MAP` entry needed, since their camelCased names snake-case onto the
  Rails ones exactly.
- Decide whether `assert_no_queries` folds onto `assert_queries_count` (it IS
  `assert_queries_count(0)`, `query_assertions.rb:47-52`) or gets its own kind
  via `NEGATION`; folding keeps the count arm comparable, a separate kind
  catches the inversion above. Prefer the one that catches the inversion.

Check the same hole for the other suite-defined assertion helpers
`helper.rb` mixes in before closing this — the fallback silently swallows every
one that has no `RAILS_MAP` row.

## Acceptance criteria

- The four query-count assertions map to canonical kinds on both sides;
  `pnpm parity:test -- --package activerecord --assertions --missing` prints no
  `[unmapped: rails:assert_no_queries]` / `rails:assert_queries_count` notes.
- A trails `assertNoQueries` standing where Rails has `assert_queries_count(1)`
  is reported as a kind mismatch, with a `scripts/test-compare` unit test
  covering it.
- `pnpm parity:test -- --package activerecord --assertions` delta is
  non-negative: any file the new kinds red is converged, not baselined.
