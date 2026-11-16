---
title: "rack-proxy-test-local-backend-routes"
status: done
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10175
claim: "2026-11-16T10:36:40Z"
assignee: "rack-proxy-network-test-suite"
blocked-by: null
closed-reason: null
---

## Context

`rack-proxy-perform-request` ported `Rack::Proxy#perform_request`
(`vendor/rack-proxy/v2.0.1/lib/rack/proxy.rb:236-372`) and the
`rack_proxy_test.rb` tests that run against the plain local backend
(`packages/rack-proxy/test/rack-proxy.test.ts`, `withWebrickProxy` over
`test/support/proxy-test-server.ts`). The PR held the 1000-LOC ceiling, so
these `vendor/rack-proxy/v2.0.1/test/rack_proxy_test.rb` tests are still
unported:

- plain backend: `head_request_streaming` (`:320`),
  `rack_backend_env_accepts_string` (`:727`),
  `gzip_body_is_forwarded_verbatim_non_streaming` / `_streaming` (`:642-648`,
  helper `assert_gzip_forwarded_verbatim` `:826`, `/gzip` route already in
  the support server).
- need new support routes (`test/support/proxy_test_server.rb:85-119`):
  `http_full_request_headers` (`/cookies/set`), `header_values_are_strings_*`
  (`/echo-headers`, `:448-456`), `response_header_included_Hop_by_hop`
  (`/chunked`, `:224`), `post_body_is_forwarded_streaming` (`:410`),
  `request_hop_by_hop_headers_are_stripped` (`:616`, `/echo-request-headers`),
  the credential / X-Forwarded-For group (`:332-408`).
- raw-socket backends (`with_malformed_backend` `:845`,
  `with_early_hints_backend` `:865`): `malformed_backend_response_returns_502`,
  `early_hints_103_is_skipped_streaming`, the four `max_response_length_*`
  (`:788-824`).
- logger: `logger_captures_request_in_*`, `no_logger_means_no_debug_output`
  (`:565-614`).
- `unknown_host_returns_502` (`:265`) stubs `Addrinfo.getaddrinfo`.
- TLS backends (`ssl: true` / `ca_signed: true`, `:52-89`, `:479-541`) need
  the self-signed and CA-signed certs of `proxy_test_server.rb:142+`.

## Acceptance criteria

- Each test above is ported under its upstream name into
  `packages/rack-proxy/test/rack-proxy.test.ts`, with the support routes it
  needs added to `test/support/proxy-test-server.ts` as in
  `proxy_test_server.rb`.
- A test that cannot run (no TLS fixture, `Addrinfo` stub) is parked as
  `it.skip` with a reason, not dropped.
