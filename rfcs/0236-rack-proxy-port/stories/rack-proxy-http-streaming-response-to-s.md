---
title: "Rack::HttpStreamingResponse#to_s"
status: ready
updated: 2026-11-15
rfc: "0236-rack-proxy-port"
cluster: null
packages: ["rack-proxy"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::HttpStreamingResponse#to_s`
(`vendor/rack-proxy/v2.0.1/lib/rack/http_streaming_response.rb:109-111`) memoizes
`@to_s` as the full body, built by `each` into a `StringIO`.
`packages/rack-proxy/lib/http-streaming-response.ts` has no `toString`;
`pnpm parity:api --package rack-proxy --missing` lists `to_s → toString` as the
only missing method in `http_streaming_response.rb` (31/32).

## Acceptance criteria

- `HttpStreamingResponse#toString` ports `to_s` line for line: memoized in
  `@to_s`, built by iterating `each`.
- A test citing `http_streaming_response.rb:109`.
- `pnpm parity:api --package rack-proxy` shows `http_streaming_response.rb` 32/32.
