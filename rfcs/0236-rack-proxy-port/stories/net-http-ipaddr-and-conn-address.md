---
title: "Net::HTTP ipaddr= and conn_address for connect and CONNECT"
status: in-progress
updated: 2026-11-16
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10168
claim: "2026-11-16T00:37:07Z"
assignee: "net-http-ipaddr-and-conn-address"
blocked-by: null
closed-reason: null
---

## Context

`Net::HTTP#connect` writes `CONNECT #{conn_address}:#{@port}` (`vendor/ruby/v3.3.11/lib/net/http.rb:1615`), and its non-proxy arm opens to `conn_address` (`:1602`). `conn_address` is `@ipaddr || address()` (`:1859`). `ipaddr` / `ipaddr=` (`:1268-1290`) are not ported, so `packages/ruby-compat/lib/net/http.ts` `connect` uses `this.address` in both places (trails#10161).

## Acceptance criteria

- Port `ipaddr` (the started arm reads the socket's peer address) and `ipaddr=` (which raises `IOError` once the session has started), plus the private `conn_address`.
- `connect` uses `conn_address` in the non-proxy arm and on the CONNECT line.
- A test sets `ipaddr=` and checks the address the connection opens to.
