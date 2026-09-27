---
title: 'Response#location returns "" where Rails'' get_header returns nil'
status: draft
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8165. `ActionDispatch::Response#location` is `get_header(LOCATION)` (`action_dispatch/http/response.rb`, `def location`), which returns nil when the header is absent. trails' `Response#location` (`packages/actionpack/src/action-dispatch/http/response.ts`) returns `this.getHeader("location") ?? ""`, so `ActionController::Metal#location` (the delegation at `metal.rb:207-208`, added in #8165) answers `""` where Rails answers nil.

## Acceptance criteria

- `Response#location` returns `undefined`/`null` when no Location header is set, typed `string | null | undefined`.
- Callers that relied on `""` (redirect assertions, `filteredLocation`) are converged to test for nil the way Rails does.
