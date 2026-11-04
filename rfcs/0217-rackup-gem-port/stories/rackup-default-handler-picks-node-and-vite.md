---
title: "Handler.default picks node/vite; drop Trails::Server's invented fallback"
status: draft
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rackup::Server#server` is `@_server ||= Handler.get(options[:server]) || Handler.default` (`vendor/rackup/v2.2.1/lib/rackup/server.rb`). `Handler.default` (`vendor/rackup/v2.2.1/lib/rackup/handler.rb:84`) reads `RACKUP_HANDLER`/`RACK_HANDLER`, then `pick(SERVER_NAMES)`. trails' `SERVER_NAMES` is `["puma","falcon","webrick"]` (`packages/rackup/src/handler.ts:73`), so none of them resolves. Because of that, `Trails::Server#server` (`packages/trailties/src/commands/server.ts`, after trails#9725) adds its own fallback: `vite` in development when a `vite.config.*` exists, `node` otherwise. Rackup has no such arm.

## Acceptance criteria

- [ ] With no `-u`, the handler comes from `Handler.default`, and its `pick` reaches `node` (and `vite` where it is registered) through the handler list, not through a trails-only branch in `Trails::Server#server`.
- [ ] `Trails::Server#server` is Rackup's one line, or is gone once `rails-server-extends-rackup-server` lands.
- [ ] Development with a Vite config still defaults to Vite; `-u node` still picks Node.
