---
title: "actionview-test-case-mounted-routes-test"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 16
pr: trails#9193
claim: "2026-10-21T21:16:17Z"
assignee: "sanitized-allowed-writers-live-in-rails-html-sanitizer-mirror"
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
