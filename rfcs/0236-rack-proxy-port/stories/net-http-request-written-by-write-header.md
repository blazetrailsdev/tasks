---
title: "Net::HTTP writes the request through write_header so debug_output shows the wire bytes"
status: in-progress
updated: 2026-11-15
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#10115
claim: "2026-11-14T23:59:53Z"
assignee: "net-http-connect-opens-tcp-before-ssl"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTPGenericRequest#write_header` (`vendor/ruby/v3.3.11/lib/net/http/generic_request.rb:399-411`) builds the request line and headers itself and writes them through `BufferedIO#write` (`vendor/ruby/v3.3.11/lib/net/protocol.rb:301-312`), so `debug_output` shows exactly the bytes on the wire. In the ruby-compat port, Node's `http.request` composes the request, and `packages/ruby-compat/lib/http-adapter.ts` (`_nodeConnect` → `request`) rebuilds a copy of the request header for `<-` debug lines (trails#10107). Node's real header set can differ: it adds or omits `Host`, `Connection` and `Transfer-Encoding`, and orders them its own way. The response `->` lines are likewise rebuilt from `rawHeaders` rather than read off the socket by `readuntil` (`protocol.rb:194-206`).

## Acceptance criteria

- The request is written as Ruby writes it: `HTTPGenericRequest#exec` / `write_header` produce the bytes and the connection writes them to the raw socket. Node's `http.request` composer is not used.
- The response status and headers are read line by line from the socket, so each `->` debug line is the received bytes.
- A test compares the `debug_output` lines against the bytes a raw `net` server received and sent.
