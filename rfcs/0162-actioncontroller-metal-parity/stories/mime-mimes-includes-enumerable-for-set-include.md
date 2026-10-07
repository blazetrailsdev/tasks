---
title: "Mime::Mimes includes Enumerable, so Collector#method_missing asks SET.include? directly"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mime::Mimes` does `include Enumerable`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:11`), so
`AbstractController::Collector#method_missing` can ask
`Mime::SET.include?(mime_constant)`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/collector.rb:36`).

trails' `Mimes` (`packages/actionpack/src/action-dispatch/http/mime-type.ts:15`)
includes no Enumerable: it hand-writes `each` and `select` only. So
`packages/actionpack/src/abstract-controller/collector.ts`'s `methodMissing`
(trails#8578) spells the check `MimeType.SET.select(() => true).includes(mimeConstant)`.

## Acceptance criteria

- `Mimes` takes Enumerable the way Rails does (`include()` of the ruby-compat
  `Enumerable`, which gains `include?` if it lacks it), and the hand-written
  `select` goes with it.
- `collector.ts`'s `methodMissing` asks `MimeType.SET` the Rails question
  directly, with no intermediate array.
