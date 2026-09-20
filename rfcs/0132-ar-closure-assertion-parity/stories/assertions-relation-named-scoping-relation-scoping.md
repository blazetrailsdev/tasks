---
title: "assertions-relation-named-scoping-relation-scoping"
status: in-progress
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7912
claim: "2026-09-20T18:47:49Z"
assignee: "assertions-relation-named-scoping-relation-scoping"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-scoping-relation-batches-insert-all-remainder` (RFC 0132). That story
converged `batches_test.rb`, `insert_all_test.rb` and most of
`scoping/default_scoping_test.rb`; `relation_test.rb` and the two remaining scoping files were
left for their own PR because the parent PR was already at its LOC ceiling.

Re-measure with `pnpm parity:test -- --package activerecord --assertions --missing`.

Open at the time of filing:

- `scoping/relation_scoping_test.rb` — 19 tests. Mostly `assert_queries_match` /
  `assert_no_match` SQL-shape assertions ported as `toBe`/`toBeTruthy`, plus
  `assert_nothing_raised` arms. Rails:
  `vendor/rails/activerecord/test/cases/scoping/relation_scoping_test.rb`.
  trails: `packages/activerecord/src/scoping/relation-scoping.test.ts`.
- `scoping/named_scoping_test.rb` — 48 tests. Rails:
  `vendor/rails/activerecord/test/cases/scoping/named_scoping_test.rb`.
  trails: `packages/activerecord/src/scoping/named-scoping.test.ts`.
- `relation_test.rb` — 33 tests. Rails:
  `vendor/rails/activerecord/test/cases/relation_test.rb`.
  trails: `packages/activerecord/src/relation.test.ts`.

Idioms settled by the parent PR, reuse them rather than re-deriving:

- `assert_difference` / `assert_no_difference` -> `assertDifference` / `assertNoDifference`
  from `@blazetrails/activesupport`, NOT a manual before/after `expect(...).toBe(before + n)`
  (that is an extra `equal` assertion and reds the ratchet).
- `error = assert_raises X ... ; assert_match m, error.message` ->
  `const error = await assertRaises([X], {}, () => ...); expect(error.message).toMatch(m)`.
  A trails `assert*` helper whose name snake-cases onto a Rails assertion IS mapped
  (`normalizeTrailsKind`, `scripts/test-compare/assertion-kinds.ts:239`), so `assertRaises`
  scores `raises` and `assertEmpty` scores `empty`.
- `assert_predicate x, :present?` -> `expect(isPresent(x)).toBeTruthy()`.
- `assert_kind_of Integer, i` -> `expect(Object(i)).toBeInstanceOf(Number)`.
- `assert_queries_count` / `assert_no_queries` / `assert_queries_match` are unmapped on BOTH
  sides, so they neither need nor cost a counterpart — the mismatches around them are always
  the surrounding `assert_kind_of` / `assert_equal` kinds.

## Acceptance criteria

- `relation_test.rb`, `scoping/named_scoping_test.rb` and `scoping/relation_scoping_test.rb`
  each report 0 assertion mismatches.
- No test renames. Do not reseed the assertion mark file.
- Split across more than one PR if the LOC ceiling demands it; file the remainder rather than
  fanning out sibling PRs.
