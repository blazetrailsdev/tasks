---
title: "lint: TS-only tests in Rails-named test files — per-file only-shrink ratchet, arel first"
status: ready
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: lint-enrollment
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` reports arel at 707/707 (100%) and, in the same line,
**300 extra (TS only)** tests — 21% of the 1,404 TS tests. Most sit inside
Rails-named test files rather than the `.trails.test.ts` twins:
`visitors/to-sql.test.ts` 112 extras beside 131 Rails tests,
`select-manager.test.ts` 42, `visitors/dot.test.ts` 35, `table.test.ts` 25,
`nodes/node.test.ts` 21, `nodes/casted.test.ts` 18, `nodes/homogeneous-in.test.ts`
14, `nodes/bound-sql-literal.test.ts` 13, `nodes/binary.test.ts` 12. Nothing
lints this; the cleanup is `arel-trails-only-tests-in-rails-named-files`, and
without a gate the count grows back.

The data already exists: `scripts/test-compare/compare.ts:288-290` computes a
per-file `extra` count from `scripts/test-compare/output/rails-tests.json` and
`ts-tests.json`, and `eslint/test-fixture-parity.mjs` shows the shape of a
per-`it()` rule driven by a Rails-test manifest (skips `it.skip`/`.todo`,
walks `describe` scope).

## Acceptance criteria

- New rule `blazetrails/rails-test-name-parity` (name per the plugin's
  convention): in a `*.test.ts` whose Rails counterpart exists in the
  test-compare manifest, every non-skipped `it()`/`test()` must have a
  same-named Rails test under the normalisation `parity:test` already applies
  (`docs/ruby-ts-conventions.md` token renames, `def test_` → spaced names).
  `*.trails.test.ts` files are exempt. Message names the file's
  `.trails.test.ts` twin as the destination.
- Like `rails-file-structure-method-order`, the rule registers only when the
  manifest has data and announces the skip otherwise.
- Ships as an only-shrink per-file ratchet (a committed mark keyed by test
  file, tightened with a `:tighten` script and never raised), seeded at
  today's arel counts so the gate is green on day one and reds on any new
  extra; `packages/arel/src/**/*.test.ts` is the first enrolled glob.
- Unit tests in `eslint/rails-test-name-parity.test.mjs` cover: matched name,
  unmatched name, skipped test exempt, `.trails` file exempt, ratchet at/over
  mark.
- No test renamed; `pnpm parity:test` arel stays 707/707.
