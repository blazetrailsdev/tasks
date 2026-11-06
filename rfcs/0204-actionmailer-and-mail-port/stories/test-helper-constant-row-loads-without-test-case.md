---
title: "TestHelper's constant row is seated only once TestCase loads"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9789
claim: "2026-11-06T16:17:50Z"
assignee: "test-helper-constant-row-loads-without-test-case"
blocked-by: null
closed-reason: null
---

## Context

trails#9773 seated `ActionMailer::TestHelper` and `ActiveJob::TestHelper` in each package's `constants.excluded.generated.ts`, imported only from `test-case.ts`. Importing the table from `test-helper.ts` too creates a cycle: the table imports `test-case.ts`, and `test-case.ts` calls `include(TestCase, TestHelper)` at module eval while `TestHelper` is still in TDZ. So a consumer that imports only `@blazetrails/activejob/test-helper` (`actionmailer/src/test-helper.ts:2`, `trailties/src/trailties/active-job.ts:23`) sees `rbModName(TestHelper)` answer `"TestHelper"` until some `TestCase` loads. Rails names the module by its constant regardless (`activejob/lib/active_job/test_helper.rb:9`, `actionmailer/lib/action_mailer/test_helper.rb:7`).

## Acceptance criteria

- `rbModName(TestHelper)` answers `ActiveJob::TestHelper` / `ActionMailer::TestHelper` when only `test-helper.ts` has been imported, verified with a plain-node import of the built `dist/test-helper.js`.
- No TDZ error when `test-case.ts` or `test-helper.ts` is the first module loaded (for example, give `test-helper.ts` its own table via `SEPARATE_SUBPATH_ENTRIES` in `scripts/api-compare/class-paths.ts`).
- `pnpm parity:class-paths --check` is clean.
