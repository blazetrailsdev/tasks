---
title: "Port the 97 examples TestProxyRequest inherits in rack's spec_request.rb"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test-compare-credits-tests-inherited-from-a-same-file-superclass` made the
Ruby extractor replay a same-file test superclass's tests under each subclass,
as Minitest runs them. `class TestProxyRequest < RackRequestTest`
(`vendor/rack/v3.1.14/test/spec_request.rb:1922-1944`) is nested in
`RackRequestTest` and inherits all 97 of its examples, running them against a
`DelegateRequest` that includes `Rack::Request::Helpers` and forwards the env
readers to a wrapped request (`:1923-1943`). `pnpm parity:test --package rack`
now counts `spec_request.rb` as 194 tests and reports the 97 as missing, so the
package reads 773/870 where it read 773/773.

`packages/rack/src/request.test.ts` ports the 97 once.

## Acceptance criteria

- [ ] `describe("TestProxyRequest")`, nested under the `RackRequestTest`
      describe, runs the 97 examples against a port of `DelegateRequest`.
- [ ] `pnpm parity:test --package rack` reports `spec_request.rb` 194/194.
