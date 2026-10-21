---
title: "actionview-test-case-not-in-published-build"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 15
pr: trails#9162
claim: "2026-10-21T01:07:06Z"
assignee: "actionview-test-case-not-in-published-build"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::TestCase` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb`) is ported at
`packages/actionview/src/test-case.ts`, but it requires `action_controller` / `action_controller/test_case`
(`test_case.rb:4-5`), and `@blazetrails/actionpack` already depends on `@blazetrails/actionview`. To avoid a package
cycle the file is excluded from `packages/actionview/tsconfig.json` and compiled only by `tsconfig.test.json`, so it is
not in the published `dist`.

## Acceptance criteria

- `ActionView::TestCase` is importable by an application from the published packages (break the cycle through a namespace seat or an owner-decided package boundary), and the `tsconfig.json` exclusion is removed.
