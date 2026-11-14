---
title: "rack-proxy-http-streaming-response"
status: ready
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps:
  - ruby-compat-net-http-surface-for-rack-proxy
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

`Rack::HttpStreamingResponse`
(`vendor/rack-proxy/v2.0.1/lib/rack/http_streaming_response.rb`, 212 lines) is
the streaming body `Rack::Proxy#perform_request` returns by default
(`lib/rack/proxy.rb:318-331`). `packages/rack-proxy` has no port; parity:api
shows `http_streaming_response.rb` 0/32.

## Acceptance criteria

- `packages/rack-proxy/lib/http-streaming-response.ts` ports the class method
  for method, including `ResponseTooLarge`.
- `test/http_streaming_response_test.rb` (17 tests) is ported under its upstream
  names, against a local backend.
