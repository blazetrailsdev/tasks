---
title: "ActionController::TestCase post keeps a path other than the routed action's, so per-form CSRF tokens fail"
status: draft
updated: 2026-10-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
