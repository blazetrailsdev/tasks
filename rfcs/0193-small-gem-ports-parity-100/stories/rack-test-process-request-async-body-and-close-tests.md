---
title: "rack-test-process-request-async-body-and-close-tests"
status: draft
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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

Left over from `rack-test-methods-alias-accessor-and-missing-tests` (methods.rb
100%, pins 67/67, MockSession alias test landed there).

- `Session#process_request` (`vendor/rack-test/v2.2.0/lib/rack/test.rb:357-371`)
  passes the app body straight to `MockResponse.new(status, headers, body, ...)`
  and `close_body(body)`. `packages/rack-test/src/test.ts` `processRequest`
  buffers the body with `for await` into a `body` array and keeps the app body
  as `rackBody`, leaving a `close_body` naming row (`ref:body` vs `ref:rackBody`)
  and missing Ruby's `.to_a` on the app result.
- The reason: `packages/rack/src/mock-response.ts` `get body()` iterates
  `this._body` synchronously, while rack-test's fake app
  (`packages/rack-test/src/fixtures/fake-app.ts` `eachBody`, behind `Lint`)
  answers an async-iterable body per CLAUDE.md § "`$!` is passed explicitly,
  and a response body is iterated async". Rack's `MockResponse#buffered_body!`
  also closes the body (`body.close if body.respond_to?(:close)`), which the
  TS getter does not.
- Missing `spec/rack/test_spec.rb` tests: "supports a Rack::Response"
  (`:203-210`, needs `@app.call(env).to_a` — rack's `Response#to_a` is
  `toArray` in `packages/rack/src/response.ts:338`), "closes response's body
  when body responds_to?(:close)" (`:231-242`), "closes response's body after
  iteration when body responds_to?(:close)" (`:244-254`).
- `uploaded_file_spec.rb` "removes local paths on garbage collection" is a
  PERMANENT-SKIP (GC finalizer), not part of this story.

## Acceptance criteria

- [ ] rack MockResponse buffers an async-iterable body and closes it as
      `buffered_body!` does; rack-test `processRequest` passes `body` to
      `MockResponse` and `closeBody` as Rails does, with `.to_a`.
- [ ] The three test_spec.rb tests above ported under their Ruby names.
- [ ] 0 rack-test rows in call-arg-mismatches.
