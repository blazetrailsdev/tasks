---
title: "rack spec_utils obsolete-symbols test asserts warn's arguments (capture_warnings)"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-20T13:55:38Z"
assignee: "globalid-extract-top-level-global-id-rb"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.1.14/test/spec_utils.rb:536-554` ("return status code and give
deprecation warning for obsolete symbols") wraps the calls in
`capture_warnings(Rack::Utils)`, which stubs `Kernel#warn` on the module and
records each call's arguments. The test then asserts
`warnings.pop.must_equal [msg, { uplevel: 3 }]`. The trails port
(`packages/rack/src/utils.test.ts`) can only spy on `stderr.write` and asserts
`toContain(...)` on the formatted line, so the test keeps an `includes` vs
`equal` kind mismatch.

## Acceptance criteria

- [ ] Rack's `Utils.statusCode` warns through a `warn` the test can intercept by
      its arguments (a module-level `warn` reached at call time, as Ruby's
      method lookup reaches the stub).
- [ ] The test asserts `[msg, { uplevel: 3 }]` with an equality, and parity:test
      shows 0 mismatches for it.
