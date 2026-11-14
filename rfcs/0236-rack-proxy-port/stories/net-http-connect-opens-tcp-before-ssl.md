---
title: "Net::HTTP#connect opens TCP before SSL and logs a connect error"
status: draft
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTP#connect` (`vendor/ruby/v3.3.11/lib/net/http.rb:1600-1690`) opens TCP, writes `debug "opened"` (:1610), and only then starts SSL: it writes `"starting SSL for …"` (:1665) and `ssl_socket_connect` (:1676), then `"SSL established …"` (:1678). If the handshake fails after TCP opened, the rescue writes `"Conn close because of connect error …"` and closes `s` (:1686-1690). The ruby-compat adapter's `connect` (`packages/ruby-compat/lib/http-adapter.ts`, `_nodeConnect`) connects with `tls.connect` in one step. So `packages/ruby-compat/lib/net/http.ts#connect` writes all three lines after the handshake, and it never reaches the connect-error arm (trails#10107).

## Acceptance criteria

- The adapter opens TCP and starts SSL as two steps (`net.connect`, then `tls.connect({ socket })`). `HTTP#connect` writes each debug line at its Ruby position, and the SSL step runs under `open_timeout` as `ssl_socket_connect` does.
- A handshake failure after TCP opened writes `Conn close because of connect error …` and closes the socket.
- A test covers the line order, and a failed handshake against a plain-TCP server.
