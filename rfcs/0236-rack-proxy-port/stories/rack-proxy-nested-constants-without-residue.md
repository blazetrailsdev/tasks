---
title: "rack-proxy-nested-constants-without-residue"
status: ready
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
closed-reason: null
---

## Context

`Rack::Proxy::InvalidRequest` and `Rack::Proxy::RequestBodyStream` are nested
under `class Proxy` (`vendor/rack-proxy/v2.0.1/lib/rack/proxy.rb:40,44`).
trails#10155 declares them as top-level exports of
`packages/rack-proxy/lib/proxy.ts` and seats them as `static readonly`
members on `Proxy`. They are exported so `parity:api` sees
`RequestBodyStream#read` / `#read_remaining`. The class-path walk cannot derive
the nested path from that shape, so `scripts/api-compare/constant-residue.json`
carries two `rack-proxy` residue rows:
`proxy.ts::InvalidRequest` and `proxy.ts::RequestBodyStream`.
`HttpStreamingResponse.ResponseTooLarge` (`lib/http-streaming-response.ts`),
a class expression on a static, lands in `unwalked` and needs no residue row.

## Acceptance criteria

- Both classes are declared so the walk derives `Rack::Proxy::InvalidRequest`
  and `Rack::Proxy::RequestBodyStream`, and the two residue rows are deleted.
- `pnpm parity:api --package rack-proxy` still reports `proxy.rb` 18/18,
  `RequestBodyStream#read` / `read_remaining` included.
- `pnpm exec tsx scripts/api-compare/class-paths.ts --check` is clean.
