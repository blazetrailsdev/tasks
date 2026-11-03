---
title: "rails-server-extends-rackup-server"
status: draft
updated: 2026-11-03
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

`Rails::Server < Rackup::Server` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:11`). `@blazetrails/rackup` now ports `Rackup::Server` and `Rackup::Handler` (`vendor/rackup/v2.2.1/lib/rackup/server.rb`, `handler.rb`), but `Server` in `packages/trailties/src/commands/server.ts` still stands alone: its `server()` accepts only `node` and carries `@noRailsEquivalent CONVERGEABLE port-rackup-server-for-rails-server`, and `defaultOptions` drops `super.merge(@default_options)` (`server_command.rb:54-56`). `Rackup::Handler.get` is async (it awaits `rbFRequire`), so `serveable?` (`:44-49`) and `use_puma?` (`:87-89`) become async on the trailties side.

## Acceptance criteria

- [ ] `Server` extends `Rackup.Server` from `@blazetrails/rackup`; `start` calls `super.start()` (`:32-41`) and the hand-rolled `Handler.Node.run` is gone.
- [ ] `defaultOptions` is `{ ...super.defaultOptions(), ...this._defaultOptions }`, and the receipt on `server()` naming `port-rackup-server-for-rails-server` is gone.
- [ ] `isServeable` awaits `server()` and rescues `LoadError, NameError` as `:44-49` does.
