---
title: "port-rackup-server-for-rails-server"
status: in-progress
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9672
claim: "2026-11-03T15:22:14Z"
assignee: "port-rackup-server-for-rails-server"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Server < Rackup::Server` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:11`), but `Rackup::Server` is unported. `Server` in `packages/trailties/src/commands/server.ts` therefore carries a stand-in `server()` accepting only `node`, and `defaultOptions` drops `super.merge(@default_options)` (`:54-56`). `--daemon`, `--pid` writing and `--config` have no serving effect.

## Acceptance criteria

Re-scoped by the repo owner on 2026-11-03: this story vendors rackup and ports it; wiring `Rails::Server` onto it is `rails-server-extends-rackup-server`.

- [ ] `vendor/sources.ts` vendors rackup v2.2.1 (`vendor/rails/v8.0.2/Gemfile.lock:445`).
- [ ] `@blazetrails/rackup` ports `Rackup::Handler` (`lib/rackup/handler.rb`) and `Rackup::Server` with its `Options` (`lib/rackup/server.rb`), with `Server#server` behind `Handler.get` / `Handler.default`.
- [ ] The receipt on trailties' `Server#server()` names `rails-server-extends-rackup-server`.
