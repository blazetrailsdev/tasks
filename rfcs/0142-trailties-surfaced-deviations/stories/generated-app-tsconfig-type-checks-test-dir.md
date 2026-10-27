---
title: "generated-app-tsconfig-type-checks-test-dir"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
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

Split from `named-route-helpers-untyped-on-controllers-and-tests`. Route helpers now type-check on `IntegrationTest` through `.trails/routes-augmentation.d.ts` (written by `trails-tsc-views build`, `packages/trails-tsc/src/build-views.ts`). The generated app's `tsconfig.json` (`packages/trailties/src/generators/app-generator.ts`, `createRootFiles`) still does not include `test/`, because a scaffolded functional test (`packages/trailties/src/generators/test-unit/scaffold/templates.ts`) fails `trails-tsc` on two unrelated counts when it is included:

- `it("…", async ({ testCase: t }) => …)`: TS2339, `testCase` is not on vitest's `TestContext`. It is seated at run time only (`packages/activesupport/src/testing/autorun.ts:112`), and nothing types it as the enclosing `describe`'s test class.
- `assertDifference(() => Model.count(), -1, async () => …)` and the two-argument form: TS2769, no overload of `assertDifference` (`packages/activesupport/src/testing/assertions.ts:355-363`) matches.

## Acceptance criteria

- [ ] `testCase` is typed in a generated app's tests as the test class the file declares.
- [ ] The scaffold's `assertDifference` calls type-check.
- [ ] The generated `tsconfig.json` includes `test/`, and the trails-tsc scaffold e2e test (`scaffold-generator.trails.test.ts`, "emits a controller that trails-tsc builds against the scaffolded model") type-checks the scaffolded functional test.
