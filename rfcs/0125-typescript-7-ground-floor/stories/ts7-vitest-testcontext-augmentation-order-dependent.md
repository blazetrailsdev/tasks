---
title: "TS7 nightly drops vitest TestContext augmentation depending on file order"
status: ready
updated: 2026-11-25
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under the TS 7.1.0-dev nightly, the `declare module "vitest" { interface TestContext { testCase: TestCase } }`
augmentation in `packages/activesupport/lib/testing/autorun.ts:24-28` is lost
depending on program file order. Found in trails#10421:
`packages/stimulus/test/generator.test.ts` (imports `vitest` after
`@blazetrails/activesupport/testing/autorun`) red with
`TS2339: Property 'testCase' does not exist on type 'TestContext & object'`
when it was the first file in `packages/stimulus/tsconfig.test.json`'s program
(sorted ahead of `manifest.test.ts`). The identical body as `test/zz.test.ts` or
`test/sub/generator.test.ts` typechecked green. trails#10421 worked around it by
importing `vitest` first; any import-sort or new earlier-sorting file can
bring it back, and other packages' generator tests carry the same pattern.

## Acceptance criteria

- Minimal repro (two files, one augmentation) against the pinned 7.1 nightly;
  report upstream to microsoft/typescript-go if it reproduces.
- Make the augmentation order-independent in trails (e.g. the augmentation
  reaching every program that uses `context.testCase` regardless of order),
  then drop the import-order dependence from `packages/stimulus/test/generator.test.ts`.
