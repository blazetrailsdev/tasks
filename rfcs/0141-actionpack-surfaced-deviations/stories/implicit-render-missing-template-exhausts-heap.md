---
title: "implicit-render-missing-template-exhausts-heap"
status: draft
updated: 2026-11-21
rfc: "0141-actionpack-surfaced-deviations"
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

Found on trails#10512. In `packages/actionpack/test/action-controller/controller/render-xml.test.ts`,
"should use implicit content type" (`vendor/rails/v8.0.2/actionpack/test/controller/render_xml_test.rb:97-100`)
does `get("implicitContentType", { format: "atom" })` on a controller with no such method. With the
fixture `test/implicit-content-type.atom.builder` absent, the worker exhausts the heap
("Ineffective mark-compacts near heap limit") instead of raising. Rails raises
`AbstractController::ActionNotFound` / `ActionView::MissingTemplate` there
(`actionpack/lib/abstract_controller/base.rb:151-153`, `action_controller/metal/implicit_render.rb:38-64`).
Reproduce by deleting that fixture and running the file alone.

## Acceptance criteria

- [ ] An implicit action with no template, under a `.atom` format, raises the Rails error class and message instead of running out of memory.
- [ ] A regression test in `packages/actionpack/test/action-controller/controller/*.trails.test.ts` fails on the current behaviour.
