---
title: "net-http-response-read-body-block"
status: draft
updated: 2026-11-13
rfc: "0216-actionmailbox-port"
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

`Net::HTTPResponse#read_body(dest = nil, &block)` (`vendor/ruby/v3.3.11/lib/net/http/response.rb`, `def read_body`) yields each body segment to a block. The port's `readBody(dest)` in `packages/ruby-compat/lib/net/http/response.ts` takes no block. Because of that, `Net::HTTP#get` (`http.rb:1914-1922`, `r.read_body dest, &block`), ported in trails#10071, and `send_entity` drop the block.

## Acceptance criteria

- `readBody(dest = null, block?)` yields the body segments, as Ruby does.
- `Net::HTTP#get` and `#sendEntity` take a trailing block and pass it to `readBody`.
- A test shows `get` yielding a body segment.
