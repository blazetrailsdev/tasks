---
rfc: "0236-rack-proxy-port"
title: "Port the rack-proxy gem"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "rack-proxy"
clusters:
  - rack-proxy
---

# RFC 0236 — Port the rack-proxy gem

## Summary

Port the `rack-proxy` gem's `Rack::Proxy` as `@blazetrails/rack-proxy`. It is
a runtime dependency of vite_ruby, and its only consumer here is
`ViteRuby::DevServerProxy`. Part of the `hotwire-via-vite` meta RFC.

## Motivation

`ViteRuby::DevServerProxy < Rack::Proxy`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/dev_server_proxy.rb:6`)
overrides `perform_request` and calls `super`. The actual forwarding is in
`Rack::Proxy`: it copies the headers, makes the HTTP call and rebuilds the
response. `vite_ruby.gemspec:25` requires `rack-proxy >= 0.6.1`. No trails
package ports it.

## Design

`packages/rack-proxy` mirrors `lib/rack/proxy.rb`, a single file of about
250 lines. The HTTP call uses ruby-compat's `Net::HTTP` where the gem does, or
the nearest settled trails HTTP client, with a receipt. The gem is vendored at
`v2.0.1`, the latest on rubygems.org on 2026-11-12. The port story confirms
that 2.x keeps the `perform_request` / `super` contract `DevServerProxy`
relies on. If it does not, the story pins the newest 0.x release instead.

## Non-goals

- **Rewriting `Rack::Proxy` around a non-`Net::HTTP` client.** The port
  follows the gem's HTTP path. Any client substitution is a receipted
  ruby-compat choice, not a redesign.

## Alternatives considered

- **Inline the forwarding into `DevServerProxy`.** This drops the parent
  class and changes the Ruby class hierarchy, and the forwarding code still
  has to be written. Rejected under "Fidelity is the job".

## Rollout

1. `rack-proxy-gem-port`.

## Verification

- `pnpm parity:api rack-proxy` and `pnpm parity:test rack-proxy` report no
  missing methods or tests.

## Open questions

None.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
