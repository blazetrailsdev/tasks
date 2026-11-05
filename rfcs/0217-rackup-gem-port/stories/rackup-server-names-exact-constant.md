---
title: "Rackup::Handler::SERVER_NAMES is Rackup's exact constant"
status: closed
updated: 2026-11-05
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "PERMANENT: by repo-owner ruling on trails#9727 (2026-11-04), Rackup::Handler::SERVER_NAMES is the handlers trails ships, vite then node, in place of Rackup's puma falcon webrick (vendor/rackup/v2.2.1/lib/rackup/handler.rb:61-62); a bun handler may join the list later."
---

## Context

`Rackup::Handler::SERVER_NAMES` is `%w(puma falcon webrick).freeze` (`vendor/rackup/v2.2.1/lib/rackup/handler.rb:61-62`), and `Handler.default` picks from it when neither `RACKUP_HANDLER` nor `RACK_HANDLER` is set (`handler.rb:64-77`). trails#9727 set `packages/rackup/src/handler.ts:73` to `["vite", "node"]`, the handlers trails ships, so `Rails::Server#server` (inherited `Rackup::Server#server`, `vendor/rackup/v2.2.1/lib/rackup/server.rb` `server`) finds a default. This changes standalone Rackup's default as well.

`packages/trailties/src/commands/server.ts` registers `Handler.loadPath["rackup/handler/vite"]`, whose load raises `LoadError` outside development or with no Vite config, so `pick` falls through to `node`.

## Acceptance criteria

- [ ] `Handler.SERVER_NAMES` is Rackup's exact `["puma", "falcon", "webrick"]` again.
- [ ] `trails server` still serves through Vite in development with a Vite config and through `node` otherwise, by a mechanism Rails' own boot has. For example, a `puma`-equivalent handler registered under a name in the list, or `RACKUP_HANDLER` set the way a Rails app's environment configures it. It must not be a `server()` override on `Rails::Server`.
- [ ] Standalone `@blazetrails/rackup` with no handler registered behaves as Rackup does when none of the three gems is installed.
- [ ] `packages/trailties/src/commands/server.trails.test.ts` keeps its development, production and `-u node` cases green.
