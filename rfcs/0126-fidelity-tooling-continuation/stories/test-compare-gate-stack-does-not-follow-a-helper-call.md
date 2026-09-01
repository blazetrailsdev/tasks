---
title: "test-compare-gate-stack-does-not-follow-a-helper-call"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# The gate stack does not follow a helper call, so shared cases read as ungated

## Context

`extractTestsFromSource` (`scripts/test-compare/extract-ts-core.ts:337-395`)
builds its adapter/feature gate stack **lexically**: `enterSuite` pushes a gate
before `ts.forEachChild(node, visit)` and pops after, so only `it()` calls
written inside the wrapper's own callback inherit it.

A test file that registers its cases from a helper therefore loses the gate. In
`packages/activerecord/src/adapters/postgresql/json.test.ts`,
`postgresqlJsonSharedTestCases(columnType)` mirrors Rails' one-module/two-includes
shape (`vendor/rails/activerecord/test/cases/adapters/postgresql/json_test.rb:6-39`)
and is called from two `describeIfPostgresqlAdapter` blocks. The helper is
declared at module top level, so its three `it()`s are walked with an empty gate
stack and emitted ungated, while Rails gates the whole file
`adapters=[postgresql]` through `PostgreSQLTestCase` (`test/cases/test_case.rb:303-305`).

The result is three `[missing-gate]` rows in `compare.ts --gates --check`, a
**hard zero with no baseline**, so the `Rails API/Test Comparison` job reds while
every local `pnpm vitest` run and every other parity gate stays green (PR #7141
hit exactly this).

The extractor already follows same-file helpers for a different purpose —
`collectHelpers(sourceFile)` feeds `countAssertions` / `collectAssertionKinds`
— so the information needed is present; only gate propagation stops at the call
boundary.

## Current workaround (to be removed by this story)

Each affected `it()` carries an inline `it.skipIf(adapterType !== "postgres")`
that is dead in every real invocation (both call sites are already inside
`describeIfPostgresqlAdapter`). It exists only to hand the extractor a gate it
can see. The same "inline it so the gate extractor sees the terms" accommodation
is already in `packages/activerecord/src/defaults.test.ts:198-204`, which spells
out the reason in a comment; the PG JSON file cannot, because
`packages/activerecord/src/adapters/**/*.ts` is enrolled in
`blazetrails/no-freeform-comments` (`eslint.config.mjs:834-848`).

## Acceptance criteria

- [ ] A call to a same-file function declaration made inside a gated `describe`
      walks that function's `it()`s under the active gate stack, without
      double-emitting them at the declaration site.
- [ ] `postgresql/json.test.ts`'s three `it.skipIf(adapterType !== "postgres")`
      guards are deleted and `compare.ts --gates --check` still reports 0
      gate-mismatch.
- [ ] The `defaults.test.ts:198-204` accommodation is re-examined: keep it only
      if its compound-guard reason survives independently of this fix.
- [ ] No other file's gate changes, or each change is explained as a
      previously-missed gate rather than a regression.
