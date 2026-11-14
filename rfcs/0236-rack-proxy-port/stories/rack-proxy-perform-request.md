---
title: "rack-proxy-perform-request"
status: ready
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps:
  - ruby-compat-net-http-surface-for-rack-proxy
  - rack-proxy-http-streaming-response
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

trails#<this PR> ported `Rack::Proxy`'s header helpers, constructor,
`rewrite_env`, `rewrite_response` and `backend_allowed?` into
`packages/rack-proxy/lib/proxy.ts`. The request path is still unported:
`vendor/rack-proxy/v2.0.1/lib/rack/proxy.rb` `call` (`:211-213`),
`perform_request` (`:240-363`), `InvalidRequest` and `RequestBodyStream`
(`:41-77`), `BACKEND_ERRORS` (`:25-39`), and the private
`response_body_permitted?`, `check_response_length!`,
`prepare_response_headers`, `net_http_request_class` and
`configure_backend_connection` (`:367-440`).

## Acceptance criteria

- Each method above is ported into `packages/rack-proxy/lib/proxy.ts` under its
  Rails name, line for line, on ruby-compat's `Net::HTTP`.
- The `rack_proxy_test.rb` tests that need no live backend
  (`request_body_stream_*`, `connect_and_write_timeouts_are_applied`,
  `ca_file_and_cert_store_are_applied`, `unknown_method_returns_501`,
  `dynamic_backend_refused_by_default`, `disallowed_backend_returns_502`, …)
  are ported under their upstream names.
- `pnpm parity:api --package rack-proxy` reports no missing method in `proxy.rb`.
