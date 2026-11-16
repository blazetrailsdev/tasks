---
title: "rack-proxy-test-empty-body-not-array"
status: closed
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
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
closed-reason: 'Delivered by trails#10175 (ffb34893f2): origin/main packages/rack-proxy/test/rack-proxy.test.ts:583 has it("empty body is not array with empty string") with both Rails assertions (status 200, body "") inline.'
---

## Context

trails#10155 dropped `test_empty_body_is_not_array_with_empty_string`
(`vendor/rack-proxy/v2.0.1/test/rack_proxy_test.rb:437-444`) to stay under the
LOC ceiling. `rack-proxy-test-local-backend-routes` does not list it. The
`/empty` route already exists in
`packages/rack-proxy/test/support/proxy-test-server.ts`, and the
`withWebrickProxy` / `get` / `lastResponse` harness is in
`packages/rack-proxy/test/rack-proxy.test.ts`.

## Acceptance criteria

- `it("empty body is not array with empty string")` is ported into
  `packages/rack-proxy/test/rack-proxy.test.ts` with Rails' two `assert_equal`
  assertions, inline (no `assert*`-named helper).
- `pnpm parity:test --package rack-proxy --assertions` shows no mismatch for it.
