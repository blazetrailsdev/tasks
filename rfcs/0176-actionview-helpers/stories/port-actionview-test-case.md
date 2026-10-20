---
title: "port-actionview-test-case"
status: ready
updated: 2026-10-20
rfc: "0176-actionview-helpers"
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

`ActionView::TestCase` (`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb`,
449 lines: `TestController`, `Behavior`, `Behavior::ClassMethods` — `tests`,
`determine_default_helper_class`, `helper_method`, `helper_class`, `new` —,
`setup_with_controller`, `render`, `rendered` / `RenderedViewContent`,
`register_parser`, `view`, `_routes`, `view_assigns`, `document_root_element`,
`method_missing` / `respond_to_missing?`) is unported; it is still listed in
`scripts/parity/unported-files/actionview.ts` ("/test_case.rb").

Every test in `vendor/rails/v8.0.2/actionview/test/template/test_case_test.rb`
(48 tests) runs as an `ActionView::TestCase` subclass, so all of them are parked
as `it.skip` in `packages/actionview/src/template/test-case.test.ts` under
`BLOCKED: port-actionview-test-case`.

## Acceptance criteria

- `ActionView::TestCase` (TestController, Behavior, ClassMethods,
  RenderedViewContent) is ported at `packages/actionview/src/test-case.ts`,
  method for method, and the `/test_case.rb` unported-files row is deleted.
- The 48 parked tests in `template/test-case.test.ts` run against it with the
  Rails bodies; any permanently unportable arm is parked under a
  `PERMANENT-SKIP:` line citing a ratified CLAUDE.md section.
