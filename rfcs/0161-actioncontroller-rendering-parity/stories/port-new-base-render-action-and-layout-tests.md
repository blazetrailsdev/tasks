---
title: "Port new_base/render_action_test.rb and render_layout_test.rb"
status: draft
updated: 2026-09-28
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "port-actionpack-view-and-helper-test-fixtures",
    "controller-render-converges-onto-abstract-controller-render",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Neither file exists in trails (`pnpm parity:test --package actioncontroller`):

- `vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_action_test.rb`
  (314 lines, 23 tests): `RenderActionTest` (`:49`, 5), `RenderLayoutTest`
  (`:86`, 4), `LayoutTest` (`:155`, 5), `TestLayout` (`:192`, 1) and two
  `ControllerLayoutTest` classes (`:230`, `:285`; 8 together), each in its own
  module with its own `BasicController`.
- `…/new_base/render_layout_test.rb` (151 lines, 10 tests): `RenderLayoutTest`
  (`:50`, 5), `LayoutOptionsTest` (`:85`, 1), `MismatchFormatTest` (`:107`, 3),
  `FalseLayoutMethodTest` (`:143`, 1).

All are `Rack::TestCase` subclasses (`abstract_unit.rb:178-218`) whose
controllers declare views through `ActionView::FixtureResolver`.

## Acceptance criteria

- `controller/new-base/render-action.test.ts` and `render-layout.test.ts` port
  every test in Rails order, under the Rails module and class names, on the
  harness's `Rack::TestCase`.
- Both files report complete in `pnpm parity:test --package actioncontroller`.
- A failing test means a port bug: fix it here if it is in a file this RFC owns,
  otherwise file it against the owning RFC and leave only that test skipped with
  the story id.
