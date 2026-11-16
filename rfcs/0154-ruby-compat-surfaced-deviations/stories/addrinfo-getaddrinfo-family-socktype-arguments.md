---
title: "Addrinfo.getaddrinfo takes family/socktype/protocol/flags and Addrinfo carries afamily"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Addrinfo.getaddrinfo(nodename, service, family = nil, socktype = nil, protocol = nil, flags = nil, timeout: nil)` (`vendor/ruby/v3.3.11/ext/socket/raddrinfo.c:2155-2162`, `rsock_getaddrinfo`) filters by address family and socket type, and returns one `Addrinfo` per result with `afamily`, `socktype` and `protocol`.

The trails port (`packages/ruby-compat/lib/socket.ts`, `Addrinfo.getaddrinfo`, added in trails#10177) takes only `nodename` and `service`. Its `Addrinfo` carries only `ipAddress` / `ipPort`, and the node adapter's `getaddrinfo` (`packages/ruby-compat/lib/http-adapter.ts`) calls `dns.lookup(host, { all: true })` with no family hint. `TCPSocket.open` therefore cannot ask for `AF_INET` only, and `Addrinfo#ipv4?` / `#ipv6?` / `#afamily` are not ported.

## Acceptance criteria

- `Addrinfo.getaddrinfo` keeps Ruby's parameter list (`family`, `socktype`, `protocol`, `flags`, `timeout`). `family` maps to `dns.lookup`'s `family` option (`:INET` / `"AF_INET"` → 4, `:INET6` → 6).
- `Addrinfo` records `afamily` / `socktype` and ports `ipv4?` / `ipv6?` as `isIpv4` / `isIpv6` (`raddrinfo.c`).
- A ruby-compat test resolves `localhost` with `family: "AF_INET"` and gets only IPv4 results.
