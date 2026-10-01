---
title: "eslint: expected-fixtures harvests fixtures([...] as const)"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

`eslint/expected-fixtures.mjs`'s `harvestUseFixturesCall` (`:147-166`) reads the first argument of
`fixtures(...)` / `useFixtures(...)` / `useHandlerFixtures(...)` only when it is an `ObjectExpression`
or an `ArrayExpression` (`:160`). `fixtures([...] as const)` parses as a `TSAsExpression` wrapping the
array, so the rule harvests no keys and reports every Rails-dereferenced set as missing.

That is why `batches.test.ts` and `calculations.test.ts` sat in `eslint/expected-fixtures-exclude.json`
although both declared every required set: trails#8326 removed the redundant casts (`fixtures` takes a
`const` type parameter, `test-fixtures.ts:700`) rather than teaching the rule. One declaration with the
cast remains, `packages/activerecord/src/batches.trails.test.ts`, and nothing stops a new one.
`eslint/test-fixture-parity.mjs` collects accessors from the destructuring, not the argument, so it is
unaffected — confirm while there.

## Acceptance criteria

- [ ] `harvestUseFixturesCall` unwraps `TSAsExpression` / `TSSatisfiesExpression` / `TSNonNullExpression` around the argument before the Object/Array check.
- [ ] `eslint/expected-fixtures.test.mjs` gains a case: `fixtures(["posts"] as const)` satisfies a file whose Rails counterpart dereferences `posts`.
- [ ] `pnpm tsx scripts/test-deps/build-fixture-baseline.ts` still regenerates `[]`.
