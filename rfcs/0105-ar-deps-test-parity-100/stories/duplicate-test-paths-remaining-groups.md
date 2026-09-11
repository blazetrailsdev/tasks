---
title: "duplicate-test-paths-remaining-groups"
status: draft
updated: 2026-09-11
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

Follow-up to `duplicate-test-paths-never-credit-past-the-first`, which deleted
the duplicated second `describe` block from
`packages/activesupport/src/ordered-hash.test.ts` and `safe-buffer.test.ts`.

Once those were removed, about 33 TS test paths still appear more times in one file than the
Rails name appears in the package's Rails manifest, so the surplus copies score
`extra (TS only)`. Measured from `scripts/test-compare/output/ts-tests.json`
against `rails-tests.json`. Duplicates that Rails also repeats, such as
`arel/table_test.rb:18,25,32` "should create join nodes with a klass" ×3 and
`arel/attributes/math_test.rb:8-80`'s `%i[* /].each` loop, already credit in
full and are NOT in scope.

Remaining groups (ts-count/rails-count):

- `activerecord/src/finder.test.ts` — 13 names ×2 (bind variables, condition
  interpolation, include/member on (un)loaded relation …).
- `activerecord/src/associations/has-many-associations.test.ts` — deleting
  updates counter cache with dependent destroy 3/1; four more ×2.
- `activerecord/src/associations/inverse-associations.test.ts`,
  `base.test.ts`, `associations.test.ts`, `reflection.test.ts`,
  `transaction-callbacks.test.ts`, `adapters/sqlite3/sqlite3-adapter.test.ts`
  — ×2 each.
- `activesupport/src/hash-ext.test.ts` (3), `hash-with-indifferent-access.test.ts`
  (2), `core-ext/duration.test.ts`, `core-ext/enumerable.test.ts`,
  `logger.test.ts`, `time-ext.test.ts` — ×2 each.
- `activesupport/src/cache/serializer-with-fallback.test.ts` — `<expr>
serializer can load <expr> dump` ×3 (Rails 0 — the interpolated title does not
  expand; check the Ruby loop in `serializer_with_fallback_test.rb`).
- `rack/src/content-type.test.ts` — `not set content-type on  responses` 3/1
  (interpolation dropped).
- `.trails.test.ts` files: `arel/visitors/to-sql.trails.test.ts`,
  `activerecord/support/load-schema-helper-arm-guard.trails.test.ts`.

## Acceptance criteria

- For each group, read the Rails counterpart (`pnpm rails:find`). Delete an
  exact duplicate copy, fold a split test back into one `it()` with the Rails
  name, or restore the Rails title where an interpolation was dropped.
- The excess count reaches 0; `parity:test` gates and the assertion ratchet stay green.
