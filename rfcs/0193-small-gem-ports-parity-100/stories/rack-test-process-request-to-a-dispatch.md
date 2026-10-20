---
title: "rack-test process_request: port @app.call(env).to_a as one dispatch, not an instanceof arm"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9139
claim: "2026-10-20T15:54:00Z"
assignee: "did-you-mean-pin-registry-and-null-checker-bodies"
blocked-by: null
closed-reason: null
---

## Context

`Session#process_request` calls `@app.call(env).to_a`
(`vendor/rack-test/v2.2.0/lib/rack/test.rb:359`). `Array#to_a` is the identity
and `Rack::Response#to_a` is `alias to_a finish`
(`vendor/rack/v3.1.x/lib/rack/response.rb:128`). trails#9123 ported this as
`result instanceof Response ? result.toArray() : result` in
`packages/rack-test/src/test.ts` `processRequest`, an arm Rails does not have.
`packages/actionpack/src/action-dispatch/middleware/cookies.ts:650` has the
same shape. ruby-compat's `rbCheckToArray` (`packages/ruby-compat/src/array.ts`,
`rb_check_to_array`, `vendor/ruby/v3.3.11/array.c:981`) dispatches `to_a`, but
it is module-private and reads `toA`, while rack's Response spells it
`toArray`.

## Acceptance criteria

- [ ] A Ruby `x.to_a` on an Array-or-Response ports as one unconditional
      dispatch call (an exported ruby-compat `to_a` dispatch, or Response
      answering the dispatch's name), with no `instanceof` arm, in both
      rack-test `processRequest` and actionpack `cookies.ts:650`.
- [ ] rack-test test_spec.rb "supports a Rack::Response" stays green.
