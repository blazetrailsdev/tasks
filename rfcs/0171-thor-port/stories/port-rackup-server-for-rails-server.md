---
title: "port-rackup-server-for-rails-server"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`Rails::Server < Rackup::Server` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:11`), but `Rackup::Server` is unported. `Server` in `packages/trailties/src/commands/server.ts` therefore carries a stand-in `server()` accepting only `node`, and `defaultOptions` drops `super.merge(@default_options)` (`:54-56`). `--daemon`, `--pid` writing and `--config` have no serving effect.

## Acceptance criteria

- [ ] `Server` extends a port of `Rackup::Server`, with its handler lookup behind `server`.
- [ ] `defaultOptions` is `super.merge`, and the receipt on `server()` naming this story is gone.
