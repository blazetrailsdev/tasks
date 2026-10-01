---
title: "Port response_test.rb's 16 skipped tests and sort its 45 extra"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "response-invented-iterators-buffer-and-missing-members",
    "port-actionpack-abstract-unit-test-support",
    "port-abstract-unit-routing-and-assertion-helpers",
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

`respond_to? accepts include_private` (`:379-382`) asserts `method_missing` is hidden without
`include_private` and answered with it. Its second assertion turns on `method_missing` being a
PRIVATE method, and trails carries no method visibility at run time (CLAUDE.md § "Method
visibility is compile-time only"): the port keeps `isRespondTo(method, includePrivate = false)`'s
two-argument signature and the first assertion, and the second is dropped under an assertion
receipt (`scripts/test-compare/assertion-receipts.ts`) citing that section.

## Acceptance criteria

- The 16 stubs are real tests with Rails' bodies, less the one receipted assertion above.
- The extra tests move to a `response.trails.test.ts` twin or are deleted as
  duplicates.
- The file reports 53/53, 0 skipped, 0 extra.
