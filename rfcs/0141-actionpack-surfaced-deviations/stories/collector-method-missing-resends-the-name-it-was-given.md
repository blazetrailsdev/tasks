---
title: "AbstractController::Collector#method_missing re-sends the name it was given, with no underscore or camelize in the body"
status: draft
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
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

`AbstractController::Collector#method_missing`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/collector.rb:26-40`)
looks the name up with `Mime[symbol]` and, for a registered type, calls
`AbstractController::Collector.generate_method_for_mime(mime_constant)` then
`public_send(symbol, ...)` with the name it was given.

trails' port (`packages/actionpack/src/abstract-controller/collector.ts`,
`methodMissing`) makes two calls Rails does not:

- `Mime.get(underscore(symbol))`, because the Proxy trap hands it the JS
  spelling (`urlEncodedForm`) and the Mime table is keyed by the Ruby one.
- `rbFPublicSend(this, camelize(symbol, false), ...args)`, added in
  trails#8677. `generateMethodForMime` defines the method under its camelCase
  spelling, so re-sending a snake_case name (`"url_encoded_form"`, which
  `MimeResponds::Collector#any`'s `rbFSend(this, type, block)` passes straight
  through, `action_controller/metal/mime_responds.rb:262-268`) missed again and
  recursed without end.

Neither call can carry an `@inventedArm` receipt today: the arms gate reports
`abstractcontroller/collector.ts methodMissing: camelize (declaration not
compared)`, so the deviation is recorded nowhere at the call site.

The root is that a Ruby method name reaches `rbFSend` in its Ruby spelling and
nothing maps it to the TS spelling of the generated method. `sendInternal`
(`packages/ruby-compat/src/object.ts`) already does this for a `foo?` predicate
(`is_foo` camelized) but not for a plain snake_case name.

## Acceptance criteria

- `methodMissing`'s body is Rails' line for line: `Mime[symbol]`,
  `generate_method_for_mime(mime_constant)`, `public_send(symbol, ...)`, with no
  `underscore` and no `camelize` in it.
- The Ruby-name to TS-spelling step lives where the name enters (the Proxy trap
  that calls `methodMissing`, and/or the send path), decided once, and
  `collector.any(":html", "url_encoded_form", handler)` still registers both
  types ("sends a Symbol or a snake_case type to the method Rails' send
  reaches", `metal/mime-responds.trails.test.ts`).
- `methodMissing` is a compared pair, or the remaining deviation carries a
  receipt the arms gate accepts.
