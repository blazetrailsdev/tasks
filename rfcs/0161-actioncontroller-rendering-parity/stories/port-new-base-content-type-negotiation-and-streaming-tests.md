---
title: "Port new_base content_type, content_negotiation, render_implicit_action and render_streaming tests"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "controller-render-converges-onto-abstract-controller-render",
    "controller-render-stream-option-is-ignored",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Absent from trails, under `vendor/rails/v8.0.2/actionpack/test/controller/new_base/`:

- `content_type_test.rb` (116 lines, 9): `ExplicitContentTypeTest` (`:44`),
  `ImpliedContentTypeTest` (`:75`), `ExplicitCharsetTest` (`:101`)
- `content_negotiation_test.rb` (4): `TestContentNegotiation` (`:18-33`)
- `render_implicit_action_test.rb` (6): `RenderImplicitActionTest` (`:17-51`).
  One of its tests, `render a simple action with new explicit call to render`,
  sits in `metal/implicit-render.trails.test.ts` today.
- `render_streaming_test.rb` (106 lines, 8): `StreamingTest` (`:46`). These need
  `render stream: true`, which trails ignores today
  (`controller-render-stream-option-is-ignored`, RFC 0141).

## Acceptance criteria

- The four files exist under `controller/new-base/` and port every test in
  Rails order. If the reported implicit-render test in the `.trails.test.ts`
  file is a port of the Rails test, it moves; if it is a trails test with a
  colliding name, it stays and the Rails test is ported.
- All four report complete in `pnpm parity:test --package actioncontroller`.
