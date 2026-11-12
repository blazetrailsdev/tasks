---
title: "Run trails server in front of Vite: DevServerProxy middleware, Procfile.dev and bin/dev"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: vite
packages: [vite-rails, trailties]
deps:
  [
    vite-assets-dev-server-proxy,
    vite-rails-install-and-precompile-hook,
    retire-trailties-vite-assets-trailtie,
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

vite_rails puts the Rails server in front: `vite_rails.proxy`
(`vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/engine.rb:6-8`) inserts
`ViteRuby::DevServerProxy` at middleware position 0, and `bin/vite dev` runs
Vite separately. trails today does the reverse. `trails server` runs the Rack
app inside Vite's `configureServer` through `trailsPlugin`
(`packages/trailties/lib/server/vite-plugin.ts`, `server/dev-server.ts`). The
RFC's Runtime topology section and its Verification depend on switching over.
This story owns RFC open question 2.

## Acceptance criteria

- `vite_rails.proxy` inserts `DevServerProxy` at position 0 when
  `ViteRuby.run_proxy?` is true, as upstream does.
- `trails server` boots the Rack app directly and does not start Vite. The
  generated app gets `Procfile.dev` (`web:` plus `vite: bin/vite dev`) and a
  `bin/dev` that runs it, as Rails 8's jsbundling layout does, with a receipt.
- `trailsPlugin` and `dev-server.ts` are no longer reachable from the
  generated app. They stay as `@internal` test infrastructure for
  0166-actiondispatch-system-testing-parity, per RFC open question 2.
- An integration test boots the app and Vite in two processes and fetches a
  Vite-served asset through the proxy.
