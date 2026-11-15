---
title: "Net::HTTPResponse#read_body streams through Net::ReadAdapter"
status: done
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10103
claim: "2026-11-14T20:58:41Z"
assignee: "net-http-read-body-streams-through-read-adapter"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTPResponse#read_body` (`vendor/ruby/v3.3.11/lib/net/http/response.rb:355-383`) builds `to = procdest(dest, block)`. With a block, `to` is a `Net::ReadAdapter` (`:646-654`, `vendor/ruby/v3.3.11/lib/net/protocol.rb` `ReadAdapter`). `read_body_0` (`:592-613`) streams each chunk into it, and `@body = to`. The ruby-compat port (`packages/ruby-compat/lib/net/http/response.ts` `readBody`) yields the whole body, which the adapter has already read, as one chunk, and keeps the bytes as `@body`.

## Acceptance criteria

- Port `Net::ReadAdapter`. `procdest` returns `to`, the response body streams chunk by chunk from the adapter, `read_body_0` writes into `dest`, and `@body = to` as in Ruby.
- `Rack::HttpStreamingResponse` gets chunks as they arrive.
- Remove the JSDoc deviation note on `readBody`.
- A ruby-compat test citing `response.rb:355-383`.
