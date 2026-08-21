---
title: "assertions-activesupport-hash-cluster"
status: claimed
updated: 2026-08-21
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T23:10:30Z"
assignee: "assertions-tail-root-6a"
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-activesupport-hash-and-ordered-options`, which shipped
the `ordered_options_test.rb` half (50 divergences -> 2) and hit the PR LOC
ceiling. The Hash files below are untouched and are the bulk of that story's
original 295.

Measured 2026-08-18 (`pnpm parity:test -- --assertions --package activesupport`),
against `vendor/rails/activesupport/test/`:

| Rails test file                          | count | kind | value |
| ---------------------------------------- | ----: | ---: | ----: |
| `hash_with_indifferent_access_test.rb`   |    60 |   74 |     3 |
| `core_ext/hash_ext_test.rb`              |    30 |   33 |     0 |
| `ordered_hash_test.rb`                   |    19 |   25 |     0 |
| `core_ext/hash/transform_values_test.rb` |     0 |    0 |     1 |

Expand per test with
`pnpm parity:test -- --assertions --missing --package activesupport` and grep for
the file; each line prints `rails N vs trails M`.

Techniques that worked in the parent PR (see `packages/activesupport/src/ordered-options.test.ts`):

- Rails `assert x` is `truthy`, not `equal` — port it as `toBeTruthy()`, and
  `assert !x` as `expect(!x).toBeTruthy()`. `assert_not` is `toBeFalsy()`.
- `assert_match` is `toMatch`, not `toContain`.
- `assert_nil` is `toBeNull()`/`toBeUndefined()`, not `toBe(null)`.
- `assert_predicate` / `assert_respond_to` have activesupport analogues in
  `packages/activesupport/src/testing/assertions.ts`.
- Where the Rails expected string is built with `#{...}` interpolation, the
  value extractor renders the interpolated part as empty; mirror it with a
  template literal on the TS side rather than a fully expanded literal.
- Rails assertions that only separate a Symbol key from a String key collapse to
  one call in TS; duplicate the call with a comment so the count still lines up.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`,
  or a call-site comment says why an assertion cannot be mirrored.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered via
  `pnpm parity:test:assertions:reseed` on a passing run; never hand-edited upward.
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
