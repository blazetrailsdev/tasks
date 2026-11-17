---
title: "generated-integration-test-extends-unseated-integration-test"
status: draft
updated: 2026-11-17
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

`packages/trailties/lib/generators/test-unit/integration/templates/integration_test.ts.tt:2-4`
writes `import { ActionDispatch } from "@blazetrails/actionpack"` and
`extends ActionDispatch.IntegrationTest`. Since trails#9923 the `.` entry only declares
`ActionDispatch.autoload("IntegrationTest", ...)` without a load path, and the constant is
seated only when `@blazetrails/actionpack/testing` is imported
(`packages/actionpack/lib/action-dispatch/testing/integration.ts:800`). So a generated
integration test reads `undefined` at class definition ("Class extends value undefined").
The scaffold and controller functional templates had the same bug (bare `IntegrationTest`
from `.`); the quickstart PR moved them to `@blazetrails/actionpack/testing`.

The ActiveJob trailtie installs `ActiveJob::TestHelper` only when `IntegrationTest` is seated
before boot (`packages/trailties/lib/trailties/active-job.ts:137-143`), so loading the testing
entry from `test-help` is too late.

Rails: `class <%= class_name %>Test < ActionDispatch::IntegrationTest`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/integration/templates/integration_test.rb.tt`),
resolved by autoload.

## Acceptance criteria

- [ ] `bin/trails generate integration_test foo` in a generated app writes a test that runs.
- [ ] A test runs a generated integration test, not only its text.
