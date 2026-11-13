---
title: "Port the rack-proxy gem as @blazetrails/rack-proxy"
status: ready
updated: 2026-11-13
rfc: "0236-rack-proxy-port"
cluster: rack-proxy
packages: [rack-proxy]
deps: [hotwire-vite-claude-md-ruling]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ViteRuby::DevServerProxy < Rack::Proxy` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/dev_server_proxy.rb:6`)
overrides `perform_request` (`:17-30`) and calls `super` into `Rack::Proxy`.
`vite_ruby.gemspec:25` depends on `rack-proxy >= 0.6.1`. No trails package
ports it, and `vendor/sources.ts` does not vendor it.

## Acceptance criteria

- `vendor/sources.ts` vendors `ncr/rack-proxy` at `v2.0.1` (rubygems.org
  latest on 2026-11-12, which satisfies `>= 0.6.1`). Record the SHA in
  `sources.lock.json`.
- `packages/rack-proxy` ports `Rack::Proxy` (`lib/rack/proxy.rb`) method for
  method: `call`, `perform_request`, `rewrite_env`, `rewrite_response` and
  the class `extract_http_request_headers` / `normalize_headers` helpers. It
  uses ruby-compat's `Net::HTTP` where the gem does, or the nearest settled
  trails HTTP client, with a receipt.
- The gem's tests are ported under their upstream names, and `compareApi` and
  `compareTests` are on.

## Verification

- `pnpm parity:api rack-proxy` and `pnpm parity:test rack-proxy` report no
  missing methods or tests.
