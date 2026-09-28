---
title: "Port response_test.rb's 16 skipped tests and sort its 45 extra"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "response-invented-iterators-buffer-and-missing-members",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/response_test.rb` (650 lines, 53
tests) matches all 53 by name in `dispatch/response.test.ts`, with 16 empty
skip stubs:

- `ResponseTest` (`:7-416`), 5 — reading the body during an action, `code`,
  `respond_to?` with `include_private`, `[response.to_a].flatten` not recursing,
  and `Rack::ContentLength` compatibility
- `ResponseHeadersTest` (`:418-470`), 1 — `add_header`
- `ResponseIntegrationTest` (`:472-650`), 10 — cache control and charset from
  Rails-ish and Rack-ish apps, strong ETags, `Content-Type` parameters and
  quoted strings, and enumerator bodies

The file also carries 45 tests with no Rails counterpart.

## Acceptance criteria

- The 16 stubs are real tests with Rails' bodies.
- The extra tests move to a `response.trails.test.ts` twin or are deleted as
  duplicates.
- The file reports 53/53, 0 skipped, 0 extra.
