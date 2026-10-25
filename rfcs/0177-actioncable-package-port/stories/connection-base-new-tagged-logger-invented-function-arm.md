---
title: "Connection::Base#new_tagged_logger drops its invented JS-function arm"
status: in-progress
updated: 2026-10-25
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9305
claim: "2026-10-25T14:48:34Z"
assignee: "connection-base-new-tagged-logger-invented-function-arm"
blocked-by: null
closed-reason: null
---

## Context

`Connection::Base#new_tagged_logger` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/base.rb:262-266`) maps each log tag with
`tag.respond_to?(:call) ? tag.call(request) : tag.to_s.camelize`.

The port (`packages/actioncable/src/connection/base.ts`, `newTaggedLogger`) adds a third arm. When the tag is a JS function, it is invoked directly, because `Function.prototype.call(request)` would bind `this` to the request and pass no argument. Only a non-function callable reaches `.call(request)`. The invented `typeof tag === "function"` arm carries no receipt, since actioncable is not enrolled in the arms gate.

## Converged shape

Two arms, exactly as Rails has them. The callable test and its invocation go through one ruby-compat helper that sends Ruby's `call` to a JS function (applying it to the arguments) as well as to an object answering `call`. That helper is the Proc#call port, and it should be reused if one exists. The body then reads `rbObjRespondTo(tag, "call") ? <call>(tag, this.request) : camelize(toS(tag))`.

## Acceptance criteria

- `newTaggedLogger` has no `typeof` arm, and its two arms are in Rails' order.
- A `logTags` entry that is a lambda `(request) => request.uuid` is still tagged with the request's value (test in `connection/base.trails.test.ts`).
