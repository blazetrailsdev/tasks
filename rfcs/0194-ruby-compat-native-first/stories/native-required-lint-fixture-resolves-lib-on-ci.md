---
title: "ruby-compat-native-required rule tests: fixture project must resolve lib on CI so Map/Set exclusions are not vacuous"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9353
claim: "2026-10-26T20:48:20Z"
assignee: "native-required-lint-fixture-resolves-lib-on-ci"
blocked-by: null
closed-reason: null
---

## Context

`eslint/ruby-compat-native-required.test.mjs` runs RuleTester with `parserOptions.project` over `eslint/fixtures/ruby-compat-native-required/tsconfig.json` (trails#9287). On the CI Unit Tests runner the fixture program loads no default lib despite `"lib": ["es2022"]`: a temporary diagnostic (run 40135132088) showed `Record<string, number>` resolving to `any` (`flags 1`, no symbol), while locally (typescript-5 5.9.3) it is a mapped `__type`. trails#9287 shadows `Record` in the test to keep the mapped-object case meaningful, but with no lib the `valid` cases for `Map<string, number>`, the `Record | Map` union and possibly the array/tuple `invalid` cases also resolve against `any` on CI, so the dispatching-receiver exclusions (`DISPATCHING` names, default-lib interface exclusion in `nativeKind`) pass vacuously there.

## Acceptance criteria

- [ ] Find why the fixture program has no lib on CI (likely the parser's TypeScript cannot locate its `lib.*.d.ts` there, so compare which `typescript` typescript-eslint resolves in CI against local) and fix it, OR give the fixture a self-contained `noLib` setup with minimal `Array` / `Map` / `Set` / `Record` declarations.
- [ ] A guard test asserts the fixture resolves `Map<string, number>` to a non-`any` type, so a lib-less run fails loudly instead of passing vacuously.
- [ ] The `Record` shadow in the `invalid` case is removed once lib resolves.
