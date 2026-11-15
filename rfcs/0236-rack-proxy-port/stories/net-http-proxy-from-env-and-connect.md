---
title: "net-http-proxy-from-env-and-connect"
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

`Net::HTTP#proxy?` (`vendor/ruby/v3.3.11/lib/net/http.rb:1785-1787`) reads
`proxy_uri` when `@proxy_from_env`; `proxy_uri` (`:1797-1803`) builds a
`URI::HTTP` and calls `find_proxy`, which is not ported in
`packages/ruby-compat/lib/uri/generic.ts`. trails' `isProxy`
(`packages/ruby-compat/lib/net/http.ts`) reads `proxyAddress` only and carries
`@missingRailsCall proxy_uri`. `proxy_address` / `proxy_port` / `proxy_user` /
`proxy_pass` (`:1807-1845`) are plain fields without their env arms, and
`Net::HTTP#connect` (`:1588-1700`) does not connect to the proxy address nor
send `CONNECT` for SSL through a proxy. `Net::HTTP.new`'s proxy arguments
(`:1100-1130`, `Net::HTTP.Proxy` `:1736-1760`) are not ported.

## Acceptance criteria

- Port `URI::Generic#find_proxy` (env read through ruby-compat's ENV), `proxy_uri`, `proxy_from_env?` and the env arms of the proxy readers; `isProxy` matches `http.rb:1785-1787` and the `@missingRailsCall proxy_uri` receipt is removed.
- `connect` opens to `proxy_address`/`proxy_port` when `proxy?`, and sends the `CONNECT` request for `use_ssl` (`http.rb:1600-1626`).
- A test connects through a raw `net` proxy server.
