---
title: "request-body-is-a-string-not-an-io"
status: draft
updated: 2026-10-01
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Request#body`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:357-364`)
returns an IO: a `StringIO` over the binary-forced `RAW_POST_DATA` when that
header is set, else `body_stream`.

trails' `Request#body`
(`packages/actionpack/src/action-dispatch/http/request.ts:439-443`) returns a
`string`: `String(rawPost)` or `this.readBodyStream()`. So a controller cannot
`request.body.rewind` / `request.body.read`, and the read value carries no
encoding.

`TestCaseTest#test_body_stream_is_binary`
(`actionpack/test/controller/test_case_test.rb:278-284`) renders
`request.body.read.encoding.name` and asserts `Encoding::BINARY.name`; it is
`it.skip` in
`packages/actionpack/src/action-controller/controller/test-case.test.ts`. The
`renderBody` action there renders `this.request.body` where Rails'
`render_body` (`test_case_test.rb:52-55`) rewinds and reads it.

## Acceptance criteria

- `Request#body` returns the `StringIO` Rails returns, binary-forced for the
  `RAW_POST_DATA` arm, and every caller reads it.
- `TestController#renderBody` is `request.body.rewind; request.body.read`, a
  `renderBodyEncoding` action is added, and `body stream is binary` is ported.
