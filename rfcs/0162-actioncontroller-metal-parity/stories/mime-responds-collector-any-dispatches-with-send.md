---
title: "MimeResponds::Collector#any dispatches each type with send, not an index read through a cast"
status: ready
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

Rails' `ActionController::MimeResponds::Collector#any` dispatches each type with
`args.each { |type| send(type, &block) }`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb:262-268`).

trails' port (`packages/actionpack/src/action-controller/metal/mime-responds.ts`,
`Collector#any`) reads the member by index through a cast,
`(this as unknown as Record<string, ...>)[type](block)`, and returns the `args`
array by hand. Since trails#8578 the collector takes
`AbstractController::Collector` through `include()` and its `method_missing`
Proxy sits in the prototype chain, so `send` has a direct port.

## Acceptance criteria

- `Collector#any` dispatches each type with `rbFSend(this, type, block)`, with
  no cast, and a type given as a Ruby Symbol string (`":html"`) or a snake_case
  name reaches the same generated method Rails' `send` would.
- `VariantCollector#any` is checked against `mime_responds.rb:312-320` in the
  same pass.
