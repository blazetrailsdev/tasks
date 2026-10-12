---
title: "ActionController::TestCase renders with no app/helpers in scope, because a test cannot boot the application"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap#63. `app/helpers` reaches a view only on a BOOTED
application: `action_controller.set_helpers_path` hands the directory over and
`helper(":all")` includes it. An application's controller tests run under
vitest, which cannot boot the application (the framework imports
`config/initializers/*` natively, outside vite's module graph), so
`ActionController::TestCase` renders views with no application helper in scope.
Rails' test environment boots, so `helper :all` has already run there.

trailmap works around it in `test/support/controller-test-case.ts`: it defines
`ApplicationHelper`'s methods through `helper`'s block form. That is a second
copy of what boot does, and a test passing through it does not prove the booted
application has the helper (trailmap proves that separately, in a child
process).

## Acceptance criteria

- [ ] A controller test in a generated application can render a view that calls an `app/helpers` method with no per-application shim
- [ ] trailmap's `ApplicationController.helper(...)` call in `test/support/controller-test-case.ts` is deleted after the re-vendor
