---
title: "Port new_base render_template, render_partial, render_file and render tests"
status: draft
updated: 2026-09-27
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

Absent from trails, under `vendor/rails/v8.0.2/actionpack/test/controller/new_base/`:

- `render_template_test.rb` (248 lines, 18): `TestWithoutLayout` (`:79`, 12),
  `TestWithLayout` (`:186`, 5), `TestTemplateRenderWithForwardSlash` (`:239`, 1)
- `render_test.rb` (141 lines, 11): `RenderTest` (`:57`, 2),
  `TestOnlyRenderPublicActions` (`:88`, 2), `TestVariousObjectsAvailableInView`
  (`:103`, 3), `TestViewInheritance` (`:120`, 4)
- `render_partial_test.rb` (4): `TestPartial`, `TestInheritedPartial`
- `render_file_test.rb` (2): `TestBasic`

## Acceptance criteria

- The four files exist at their convention paths under
  `controller/new-base/` and port every test in Rails order under the Rails
  class names.
- All four report complete in `pnpm parity:test --package actioncontroller`.
