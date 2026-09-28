---
title: "Port new_base render_body, render_html and render_plain tests"
status: draft
updated: 2026-09-28
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
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

- `render_body_test.rb` (172 lines): `RenderBodyTest` (`:81`), 12 tests
- `render_html_test.rb` (192 lines): `RenderHtmlTest` (`:84`), 15 tests
- `render_plain_test.rb` (170 lines): `RenderPlainTest` (`:76`), 13 tests

These pin what RFC 0140's render convergence produces for `body:`, `html:` and
`plain:`: the body, `html_safe` escaping, the content type from
`_set_rendered_content_type` / `_set_html_content_type`, layouts, and `status:`.

## Acceptance criteria

- The three files exist under `controller/new-base/` and port every test in
  Rails order.
- All three report complete in `pnpm parity:test --package actioncontroller`.
