---
title: "assertions-migration-constraint-files"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
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

`assertions-migration-cluster` (RFC 0105) converged the seven Rails migration
test files named in its own table. Two more migration files carry an assertion
cluster that no story owns, and `port-migration-constraints-and-residue`
(PR #7253) grew each by one while that work was in flight:

Measured 2026-08-30 on `origin/main`:

| Rails test file (under `vendor/rails/activerecord/test/cases/`) | count | kind |
| --------------------------------------------------------------- | ----: | ---: |
| `migration/unique_constraint_test.rb`                           |     5 |    8 |
| `migration/exclusion_constraint_test.rb`                        |     4 |    5 |

Per-test breakdown via
`pnpm parity:test -- --package activerecord --assertions --missing`, grepping
for each file. trails counterparts:
`packages/activerecord/src/migration/unique-constraint.test.ts` and
`.../exclusion-constraint.test.ts`.

The shapes here are the ones already settled by PR #7261:

- `assert_empty` → `assertEmpty()` from `@blazetrails/activesupport` — vitest
  has no `empty` matcher, and `toEqual([])` scores as `equal`. Hits
  `remove unique constraint` and `remove unique constraint by column`.
- `assert_no_changes` → `assertNoChanges(expr, null, { from }, block)` — both
  `*constraints scoped to schemas` tests currently score `equal` where Rails is
  unmapped.
- The `deferrable` tests are assertion-COUNT gaps (rails 4-5 vs trails 2-3):
  read the Rails bodies and port the assertions they actually make, rather than
  collapsing several `assert_equal`s into one object comparison.

Both files are PostgreSQL-only (exclusion constraints and `USING INDEX` unique
constraints), so this needs a PG lane to verify — a SQLite-only run skips them
and proves nothing.

## Acceptance criteria

- Both files report 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --package activerecord --assertions`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered via
  `pnpm parity:test:assertions:reseed` (only-shrink; never hand-edited upward).
- No test name changes; `pnpm parity:test` percent for activerecord does not drop.
