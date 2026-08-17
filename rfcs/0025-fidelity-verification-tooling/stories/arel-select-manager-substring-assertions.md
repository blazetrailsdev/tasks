---
title: "select-manager.test.ts asserts SQL substrings where Rails must_be_like's the full statement"
status: ready
updated: 2026-07-31
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/select-manager.test.ts` is a port of
`vendor/rails/activerecord/test/cases/arel/select_manager_test.rb`, but many of
its cases assert `expect(sql).toContain("UNION")`-style substrings where the
Rails test asserts the complete statement with `must_be_like`. A substring
assertion passes on almost any malformed SQL, so these tests do not hold the
behavior their Rails twins hold.

This was not theoretical. PR #5741 fixed two real CTE bugs (`As#toCte` had its
`left`/`right` inverted vs `binary.rb:43-45`, and a `SelectManager` CTE body
double-wrapped its parens) that had shipped undetected precisely because the two
`describe("with")` cases asserted only `toContain("WITH")` and built a
`TableAlias` instead of Rails' `Arel::Nodes::As.new(cte_table, query)`. Restoring
those two bodies to `select_manager_test.rb:318-363` made both bugs fail loudly.
Those two are fixed; the rest of the file is unaudited.

Known remaining instances (not exhaustive — audit the file):

- `describe("union")` — "should union two managers" / "should union all"
  assert `toContain("UNION")`; `select_manager_test.rb` asserts full SQL.
- Same shape in the `intersect` / `except` neighbours.

A `mustBeLike` helper (whitespace-collapsing compare, the minitest
`must_be_like` analogue) already exists at the top of the file from #5741 —
reuse it rather than adding a second one.

## Acceptance criteria

- Audit `select-manager.test.ts` for cases whose Rails twin asserts full SQL via
  `must_be_like` but whose port asserts a substring / `toBeInstanceOf`, and
  restore each body to the Rails one.
- Test names are NOT changed (they are how `parity:test` matches).
- Each restored assertion is verified to actually constrain: confirm it fails if
  the produced SQL is perturbed, rather than only that it passes today.
- `pnpm vitest run packages/arel` green; `pnpm parity:test` shows no regression
  in the arel bucket.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
