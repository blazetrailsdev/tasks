---
title: "Port request_test.rb's 28 skipped tests and sort its 30 extra"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support", "request-mixin-bodies-onto-their-rails-files"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/request_test.rb` (1448 lines,
121 tests) matches all 121 by name in
`packages/actionpack/src/action-dispatch/dispatch/request.test.ts`, but 28 are
empty skip stubs:

- `RequestIP` (`:67`), 9 — `remote_ip` spoof detection (v4 and v6, disabled,
  private addresses) and user-specified trusted proxies as `String` / `Regexp`
- `RequestMethod` (`:724`), 3 — invalid HTTP methods unaffected by I18n and
  inflections; `method` with an argument delegates to `Object#method`
- `RequestParamsParsing` (`:601`), 2 — `BadRequest` when `content-length` is
  lower or higher than the multipart body
- `RequestFormat`, 2 — `format` survives malformed GET / invalid POST params
- `RequestRewind` (`:652`), 1
- `RequestParameters`, 11 — invalid UTF-8 in path, query and POST params,
  `ASCII_8BIT`, and access to the original exception after a Rack parse error

The file also carries 30 tests with no Rails counterpart.

## Acceptance criteria

- The 28 stubs are real tests with Rails' bodies.
- The 30 extra tests move to `request.trails.test.ts` unless they duplicate a
  Rails test (then they are deleted).
- The file reports 121/121, 0 skipped, 0 extra.
