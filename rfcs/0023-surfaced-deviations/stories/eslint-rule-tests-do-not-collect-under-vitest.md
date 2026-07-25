---
title: "ESLint rule tests (eslint/*.test.mjs) collect as 'no tests' under vitest"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vitest.config.ts:413` lists `eslint/*.test.mjs` in the `other` project's
`include`, so the ESLint rule unit tests are meant to run with the suite. They
do not collect: running either

```console
npx vitest run eslint/require-canonical-rebuild.test.mjs
npx vitest run eslint/require-table-teardown.test.mjs
```

fails with `Error: No test suite found in file …` and `Tests no tests`. Both
files pass under `node --test` (verified during PR #5273:
`node --test eslint/require-canonical-rebuild.test.mjs` → 1 pass), so the tests
themselves are fine — ESLint's `RuleTester` registers cases via `describe`/`it`
globals it detects at import time, and under vitest's collection it registers
none.

The consequence is that every `eslint/*.test.mjs` rule test is either silently
non-guarding or is failing/being skipped in a way nobody reads. Since these are
the only tests for a dozen custom lint rules (`require-table-teardown`,
`require-canonical-rebuild`, `test-fixture-parity`, `no-internal-canonical-loaders`,
…), a rule regression would ship unnoticed.

Not caused by PR #5273 — it is repo-wide and pre-existing; surfaced while
verifying that PR's rule changes.

## Acceptance criteria

- Determine whether `eslint/*.test.mjs` actually execute in CI today (if they
  do, explain the local/CI divergence; if they do not, say so in the fix).
- Wire them so they run and can fail: either enable vitest globals for the
  `other` project so `RuleTester` finds `describe`/`it`, or run the rule tests
  through `node --test` from a dedicated script/CI step and drop the
  `eslint/*.test.mjs` include from `vitest.config.ts`.
- Prove the wiring bites: a deliberately broken rule assertion must fail the
  chosen runner.
