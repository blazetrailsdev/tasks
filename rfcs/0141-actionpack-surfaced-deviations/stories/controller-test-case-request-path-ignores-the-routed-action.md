---
title: "ActionController::TestCase post keeps a path other than the routed action's, so per-form CSRF tokens fail"
status: closed
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-16T23:07:02Z"
assignee: "ascii-8bit-param-encoding-answers-a-js-string-not-bytes"
blocked-by: null
closed-reason: "FALSIFIED: Rails' TestCase#process does not reset PATH_INFO between requests either (assign_parameters uses fetch_header, test_case.rb:139; request_forgery_protection_test.rb:934 says 'PATH_INFO isn't reset between requests' and sets it by hand). trails matches Rails; the trailmap test should set request.env PATH_INFO as Rails' tests do."
---

## Context

In trailmap's `test/controllers/rfc-status.test.ts`, `tc.get("show")` then
`tc.post("move", ...)` reaches `isValidPerFormCsrfToken` with `request.path`
`/rfc/:id`, not the routed `/rfc/:id/status`. The token `buttonTo` wrote is
bound to the routed path, so a valid token is refused. The cause (stale path
from the earlier request, or wrong generation) is not yet established.

trailmap turns `perFormCsrfTokens` off for that one test as a commented
temporary workaround.

## Acceptance criteria

- A trails test reproduces it, and `TestCase#process` sets the path of the
  action being processed, as Rails does.
- After re-vendoring, trailmap deletes the `perFormCsrfTokens` toggle.
