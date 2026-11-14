---
title: "rack-proxy-network-test-suite"
status: ready
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps:
  - rack-proxy-perform-request
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

Most of rack-proxy v2.0.1's suite runs against a local WEBrick/TLS backend
started by `vendor/rack-proxy/v2.0.1/test/support/proxy_test_server.rb`:
the network tests in `test/rack_proxy_test.rb`, all of
`test/security_regression_test.rb` (13 tests), `test/examples_test.rb` and
`test/live_smoke_test.rb`.

## Acceptance criteria

- A test-support port of `proxy_test_server.rb` under
  `packages/rack-proxy/test/support/`.
- The remaining `rack_proxy_test.rb` network tests and `security_regression_test.rb`
  are ported under their upstream names. `live_smoke_test.rb` (public internet)
  and `examples_test.rb` are ported or parked with a reason.
- `pnpm parity:test` reports no missing rack-proxy test.
