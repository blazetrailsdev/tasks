---
title: "actionview-test-case-mounted-routes-test"
status: claimed
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-20T22:59:51Z"
assignee: "actionview-render-plain-is-async-inside-capture-block"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/template/test-case.test.ts` parks Rails' `ATestHelperTest`
"is able to use mounted routes" (`vendor/rails/v8.0.2/actionview/test/template/test_case_test.rb:256-274`).
The Rails body builds `Class.new(Rails::Engine)`, mounts it with `set.draw { mount app => "/foo", as: "foo_app" }`
and calls `foo_app.bar_path` through `singleton_class.include set.mounted_helpers`. `Rails::Engine` lives in
`@blazetrails/trailties`, which actionview's test tsconfig (`packages/actionview/tsconfig.test.json`) does not map, and
`ActionView::TestCase::Behavior#method_missing` (`actionview/lib/action_view/test_case.rb:415-431`, ported in
`packages/actionview/src/test-case.ts`) only forwards `mounted_helpers` names.

## Acceptance criteria

- The test runs with the Rails body against a `Rails::Engine` subclass, or is parked naming a ratified CLAUDE.md section.
