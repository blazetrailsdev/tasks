---
title: "assertions-migration-test-file"
status: draft
updated: 2026-08-30
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
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

`assertions-migration-cluster` (RFC 0105) burned the migration assertion cluster
down to 0 in six of its seven files. `migration_test.rb` is left: it alone
carries **46 assertion-count and 74 assertion-kind divergences** across ~90
tests, which does not fit inside one PR's LOC ceiling next to the other six.

Measured 2026-08-30 after PR for `assertions-migration-cluster`:

| Rails test file     | count | kind | value |
| ------------------- | ----: | ---: | ----: |
| `migration_test.rb` |    46 |   74 |     0 |

Expand per test with
`pnpm parity:test -- --package activerecord --assertions --missing` and grep for
`migration_test.rb ›`. trails counterpart:
`packages/activerecord/src/migration.test.ts`.

The recurring shapes, all settled by the sibling story's PR — copy them:

- `assert` / `assert_predicate` → `toBeTruthy()`, `assert_not` /
  `assert_not_predicate` → `toBeFalsy()` (never `toBe(true)`/`toBe(false)`,
  which score as `equal`).
- `assert_empty` → `assertEmpty()` from `@blazetrails/activesupport` (vitest has
  no `empty` matcher).
- `assert_raises` → `assertRaises([Klass], { match }, () => …)`; a
  `.catch(e => e)` + `toBeInstanceOf` pair scores `instanceOf`, not `raises`.
- `assert_nothing_raised` → `assertNothingRaised(() => …)`.
- `assert_no_changes` → `assertNoChanges(expr, null, { from }, block)`.
- `assert_queries_count`, `assert_column` / `assert_no_column`,
  `assert_difference` are unmapped on the Rails side — the port must call a
  correspondingly-named `assert*` helper so BOTH sides are unmapped rather than
  scoring `equal`/`includes`.
- An adapter branch (`if current_adapter?(…)`) counts BOTH arms on the Rails
  side. `vitest/no-conditional-in-test` is `error` for
  `packages/activerecord/**/*.test.ts`, so put the branch in a same-file
  `function` declaration whose name does NOT start with `assert`/`expect`/`must`
  — a non-assertion helper folds its assertions into the caller's count, while
  an `assert*`-named one is scored as a single unmapped assertion instead.

## Acceptance criteria

- `migration_test.rb` reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --package activerecord --assertions`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered via
  `pnpm parity:test:assertions:reseed` (only-shrink; never hand-edited upward).
- No test name changes; `pnpm parity:test` percent for activerecord does not drop.
- No new rows in `scripts/parity/unported-files/`.
