---
title: "net-http-send-request-with-body-stream"
status: draft
updated: 2026-11-15
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

trails#<PR for net-http-request-written-by-write-header> ported
`HTTPGenericRequest#exec` / `#write_header` over `Net::BufferedIO`
(`packages/ruby-compat/lib/net/http/request.ts`), but left out `exec`'s
`@body_stream` arm to fit the LOC ceiling:
`send_request_with_body_stream` and `Chunker`
(`vendor/ruby/v3.3.11/lib/net/http/generic_request.rb:242-257`, `:268-283`),
plus `HTTPHeader#chunked?` on the request (`header.rb:654-658`). A request
with `body_stream=` set currently writes only its header. `IO.copy_stream`
reads a non-IO source with `read(len)` until it answers `nil`
(`vendor/ruby/v3.3.11/io.c:13176-13189`); ruby-compat's `IO.copyStream` is
sync, so the copy is an awaited `read` / `write` loop.

`Rack::Proxy#perform_request` (story `rack-proxy-perform-request`) forwards a
request body through `body_stream=`, and its `BACKEND_ERRORS`
(`vendor/rack-proxy/v2.0.1/lib/rack/proxy.rb:25-39`) also needs
`Net::ProtocolError` (`vendor/ruby/v3.3.11/lib/net/protocol.rb:60`) and
`Errno::EHOSTUNREACH` / `Errno::ENETUNREACH` in `packages/ruby-compat/lib/errno.ts`.

## Acceptance criteria

- `exec` has its `@body_stream` arm: `sendRequestWithBodyStream` raises
  `ArgumentError` "Content-Length not given and Transfer-Encoding is not
  `chunked'" without either, writes the header, then copies the stream through
`Chunker`when`chunked?` and straight to the socket otherwise.
- `Net::ProtocolError`, `Errno::EHOSTUNREACH` and `Errno::ENETUNREACH` exist
  and are seated on `Net` / `Errno`.
- A test posts a `body_stream` with Content-Length and one chunked, against a
  raw `net` server, and compares the received bytes.
