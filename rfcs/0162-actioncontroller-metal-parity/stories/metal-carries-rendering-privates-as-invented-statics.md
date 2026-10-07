---
title: "ActionController::Metal carries Rendering's private instance methods as invented statics"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/metal.ts` assigns seven of `ActionController::Rendering`'s private instance
methods as STATIC members of `Metal`: `_normalizeOptions`, `_normalizeText`, `_processOptions`, `_renderInPriorities`,
`_setHtmlContentType`, `_setRenderedContentType`, `_setVaryHeader`. Rails defines them once, as private instance methods
of the module (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:186-234`), and `Metal`
(`action_controller/metal.rb`) has no such class methods.

Since trails#8607 `_normalizeOptions` and `_processOptions` end in `Rendering.superMethod(this, ...)!(options)`, so the
static copies raise if called: `Metal` has no `Rendering` link. Their only reader is the identity assertion
"exposes the rendering privates as static members" in `metal/rendering.test.ts`.

## Acceptance criteria

- [ ] `Metal` carries none of the seven statics and `metal.ts` no longer imports them.
- [ ] The "exposes the rendering privates as static members" test is removed or asserts `Rendering.instanceMethod(...)`.
