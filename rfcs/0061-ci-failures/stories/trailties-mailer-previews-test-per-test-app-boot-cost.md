---
title: "Cut mailer-previews.test.ts per-test app boot cost and fold it back into the trailties shards"
status: in-progress
updated: 2026-11-27
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10824
claim: "2026-11-26T23:44:44Z"
assignee: "ar-postgres-non-isolated-cases-step-slower-than-sqlite"
blocked-by: null
closed-reason: null
---

## Context

trails#10546 gave `packages/trailties/test/application/mailer-previews.test.ts` a CI leg of its own (`Trailties Tests (mailer-previews)` in `.github/workflows/ci.yml`, excluded from the other legs through `TRAILTIES_EXCLUDE` in `vitest.config.ts`). That leg is now the job's floor: about 651s for 33 tests, roughly 16–20s each. Each test runs the `buildApp` override (`mailer-previews.test.ts:19-34`), which calls `Generation.prototype.buildApp` and rewrites `config/application.ts`, and then boots the app in an `Isolation` subprocess. The next slowest files are `test-runner.test.ts` (203s) and `multiple-applications.test.ts` (195s).

## Acceptance criteria

- Profile one test to see how much of the ~18s goes to the app copy, the boot, and the request.
- Cut the per-test cost, for example by reusing the template build or making the isolated boot cheaper, without changing any test name or body against Rails `railties/test/application/mailer_previews_test.rb`.
- Once the file runs under about 5 min, fold it back into the numbered shards: remove the `mailer-previews` matrix leg and `TRAILTIES_EXCLUDE`.
