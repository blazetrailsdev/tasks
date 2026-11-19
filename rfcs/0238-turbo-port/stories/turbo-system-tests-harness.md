---
title: "Turbo system-test harness and the system/ tests"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10362
claim: "2026-11-19T15:31:41Z"
assignee: "turbo-stream-renderer-and-collector-camelcase"
blocked-by: null
closed-reason: null
---

## Context

`turbo-system-test-helper` ported `Turbo::SystemTestHelper`
(`packages/turbo/lib/system-test-helper.ts`, from
`vendor/turbo-rails/v2.0.23/lib/turbo/system_test_helper.rb:28-130`) and its engine
wiring (`engine.rb:133-150`), but the turbo dummy app has no system-test harness, so
nothing drives a browser against it yet.

Precedent: `packages/actiontext/test/application-system-test-case.ts` (Vite root on the
dummy app, `SystemTestCase.startApplication`, `drivenBy("playwright")`), per
packages/actionpack/CLAUDE.md "System testing runs on Vitest".

Rails tests to port as `*.system.test.ts`:

- `vendor/turbo-rails/v2.0.23/test/application_system_test_case.rb`
- `test/system/assertions_test.rb` (3 tests, exercises assertTurboCableStreamSource)
- `test/system/broadcasts_test.rb`
- `test/system/form_submissions_test.rb`

## Acceptance criteria

- `packages/turbo/test/application-system-test-case.ts` boots the turbo dummy under Vite and Playwright.
- The three `test/system/*_test.rb` files are ported with Rails test names verbatim; anything that has no counterpart is parked under `PERMANENT-SKIP:`.
- `testConnectAfterActions` is exercised: the Rails default `["visit"]` names a method trails' `SystemTestCase` doesn't have (navigation goes through `page().goto`). Either the default converges onto a real method or that is filed for an operator ruling.
