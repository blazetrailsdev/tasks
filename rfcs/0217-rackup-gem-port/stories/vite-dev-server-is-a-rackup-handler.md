---
title: "vite-dev-server-is-a-rackup-handler"
status: done
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9725
claim: "2026-11-04T19:25:18Z"
assignee: "rackup-builder-loads-config-ts"
blocked-by: null
closed-reason: null
---

## Context

In development with a `vite.config.ts`, `Trails::Server#start` (`packages/trailties/src/commands/server.ts`) bypasses `Handler.Node.run` and starts `DevServer` (`packages/trailties/src/server/dev-server.ts`). Rails has no such arm: `start` is `super()` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:32-41`), and the server is whatever `Rackup::Handler` `server` resolves (`vendor/rackup/v2.2.1/lib/rackup/handler.rb` `get` / `default`). The faithful seat for the Vite server is a Rackup handler registered with `Rackup::Handler.register` (`packages/rackup/src/handler.ts`), chosen by `-u` or by the default.

## Acceptance criteria

- [ ] `DevServer` is reachable as a registered Rackup handler with `run(app, options)`; `Trails::Server#start` no longer branches on `hasViteConfig`.
- [ ] Development with a Vite config still serves through Vite by default; `-u node` picks the plain handler.
- [ ] Existing dev-server tests keep passing.
