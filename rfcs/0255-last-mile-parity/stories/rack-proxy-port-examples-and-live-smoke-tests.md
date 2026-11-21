---
title: "rack-proxy: port the examples and the LIVE-gated smoke tests"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [rack-proxy]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

"examples are safe to load" and two live smoke tests are skipped as "examples
not shipped; network". The examples are four small `Rack::Proxy` subclasses,
and upstream gates the live tests on `LIVE=1` (`vendor/rack-proxy/v2.0.1/test/live_smoke_test.rb:27`); the examples are `vendor/rack-proxy/v2.0.1/examples/*.rb`, loaded by `test/examples_test.rb`.
"request body stream read without length fills the buffer" stays PERMANENT
(String identity).

## Acceptance criteria

- [ ] The four examples are ported under the gem's `examples/` layout.
- [ ] "examples are safe to load" runs and passes.
- [ ] The live smoke tests are ported and skipped unless `LIVE=1`, as upstream; test-compare credits them.
- [ ] The remaining PERMANENT receipt cites CLAUDE.md "Ruby Strings are JS string primitives".

## Verification

```sh
pnpm vitest run packages/rack-proxy && LIVE=1 pnpm vitest run packages/rack-proxy/test/live-smoke.test.ts
```
