---
title: "Port rack's Response headers-hash ArgumentError test and move the misplaced mock-request test"
status: in-progress
updated: 2026-11-10
rfc: "0228-small-gem-tail-parity"
cluster: null
packages:
  - "rack"
deps: []
deps-rfc: []
est-loc: 40
priority: 3
pr: trails#9948
claim: "2026-11-10T13:44:28Z"
assignee: "rake-guarded-tests-and-thread-history-path"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.2.8/test/spec_response.rb:21-25` "raises ArgumentError unless
headers is a hash" checks `Rack::Response.new(nil, 200, Object.new)`, the
constructor's headers argument. `rack-response-header-accessors-raise-argument-error-on-rack-headers`
(RFC `0141-actionpack-surfaced-deviations`) covers the four header accessors,
not the constructor, so it does not overlap. "should handle :input object that
does not respond to set_encoding" sits in
`packages/rack/test/mock-request.trails.test.ts` instead of `mock-request.test.ts`.

## Acceptance criteria

- [ ] The response test is ported by name; if `Response`'s constructor lacks the
      raise, it is ported from `vendor/rack/v3.2.8/lib/rack/response.rb`.
- [ ] The mock-request test moves to `mock-request.test.ts`.
