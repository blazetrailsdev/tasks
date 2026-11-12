---
title: "ActionPack journey, response, live streaming and system testing stop dropping promises"
status: ready
updated: 2026-11-12
rfc: "0234-no-void-promises"
cluster: discarded-calls
packages: [actionpack]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `action-dispatch/journey/router.ts:34`,
`journey/path/pattern.ts:172-174`, `journey/route.ts:240,241`,
`journey/formatter.ts:131`, `http/response.ts:149`,
`middleware/show-exceptions.ts:76,83`, `system-testing/driver.ts:68`,
`action-controller/metal/live.ts:82`,
`action-controller/metal/params-wrapper.ts:147`. Several journey sites may be
`void` on a memoizing getter rather than a promise.

## Acceptance criteria

- [ ] Each site awaits or returns its promise, or drops a non-promise `void`.
- [ ] `driver.ts:68`'s preload is awaited where Rails' driver is used, not pre-observed.
- [ ] actionpack's `floating` and `swallowed` marks drop by exactly the sites listed above.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
