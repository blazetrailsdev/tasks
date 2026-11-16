---
title: "rack-proxy-unknown-host-addrinfo-stub"
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

`test_unknown_host_returns_502` (`vendor/rack-proxy/v2.0.1/test/rack_proxy_test.rb:246-258`)
redefines `Addrinfo.getaddrinfo` so `no-such-host.invalid` raises `SocketError`
without an external DNS query. ruby-compat's `Net::HTTP` resolves through its
http adapter, with no `Addrinfo.getaddrinfo` seat to stub. The test is parked as
`it.skip` under `// BLOCKED: rack-proxy-unknown-host-addrinfo-stub` in
`packages/rack-proxy/test/rack-proxy.test.ts`.

## Acceptance criteria

- `Net::HTTP#connect` resolves through a ruby-compat `Addrinfo.getaddrinfo`
  a test can replace, as `TCPSocket.open` does in MRI.
- `unknown host returns 502` runs unskipped and makes no DNS query.
