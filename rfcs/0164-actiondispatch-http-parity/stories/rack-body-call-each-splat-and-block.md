---
title: "rack-body-call-each-splat-and-block"
status: done
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8932
claim: "2026-10-15T12:24:15Z"
assignee: "port-live-response-and-small-http-tests"
blocked-by: null
closed-reason: null
---

# RackBody#call and #each take Rails' splat plus block

## Context

`packages/actionpack/src/action-dispatch/http/response.ts` `RackBody#call(arguments_: unknown[] = [], block?)`
turns Rails' splat into an array slot. `RackBody#each()` takes neither args nor block. Rails:
`def each(*args, &block) @response.each(*args, &block) end` and
`def call(*arguments, &block) @response.stream.call(*arguments, &block) end`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:526-533`). A Rack hijack-style
`body.call(stream)` would spread a non-iterable. The block-param gate (`scripts/api-compare/lint-block-params.ts`)
credits only a trailing function-typed `fn`/`block` parameter, which cannot follow a rest.

## Acceptance criteria

- `call` and `each` take a variadic argument list and a block in the shape `lint-block-params.ts` / `arity.ts` credit.
  If that means teaching the gate to credit a rest whose last element is a `block()`-marked function
  (`@blazetrails/ruby-compat` `block`), do so.
- `body.call(stream)` forwards `stream` unchanged; a test covers it.
- The `http/response.rb` block-param mark does not grow.
