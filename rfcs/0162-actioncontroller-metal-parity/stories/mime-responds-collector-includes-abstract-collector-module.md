---
title: "MimeResponds::Collector includes AbstractController::Collector as a module, with Rails' method_missing"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8578
claim: "2026-10-06T14:39:43Z"
assignee: "head-is-a-module-included-by-conditional-get-not-a-metal-method"
blocked-by: null
closed-reason: null
---

## Context

Split out of `metal-and-abstract-base-missing-methods`, whose other criteria shipped.

`pnpm parity:api --package actioncontroller --inheritance` reports
`MimeResponds::Collector` extending `AbstractCollector`
(`packages/actionpack/src/action-controller/metal/mime-responds.ts:14`). Rails'
`class Collector` has no superclass and does `include AbstractController::Collector`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb:251-252`),
a module (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/collector.rb:8-43`).

It was not a mechanical swap. trails' `AbstractController::Collector`
(`packages/actionpack/src/abstract-controller/collector.ts`) is an abstract class
whose constructor returns a `Proxy`, and `MimeResponds::Collector` keeps its state
in `#private` fields that only work because `super()` hands back that Proxy as
`this`. `include()` copies prototype members and cannot replace `this`, so the
Proxy has to move. Rails' module has a private `method_missing`
(`collector.rb:27-42`) that raises `NoMethodError` with a fixed message for an
unregistered MIME, and calls `generate_method_for_mime` + `public_send` for one in
`Mime::SET`; trails' handler throws a `TypeError` with a different message and
`generateMethodForMime` generates nothing. `collector.test.ts` has 18 tests written
against `class X extends Collector`.

## Acceptance criteria

- `AbstractController::Collector` is a module carrying Rails' `method_missing`
  body (same error class and message, `collector.rb:28-34`) and
  `generate_method_for_mime` (`collector.rb:9-16`).
- `MimeResponds::Collector` has no superclass and takes the module through
  `include()`; its ivars are `@responses` / `@variant` fields, not `#private`.
- The `method_missing` Proxy follows the "Proxy" row for
  `action_controller/metal/mime_responds.rb` in CLAUDE.md § "Ruby protocol methods
  with a different JS mechanism".
- `pnpm parity:api --package actioncontroller --inheritance` reports 15/15.
