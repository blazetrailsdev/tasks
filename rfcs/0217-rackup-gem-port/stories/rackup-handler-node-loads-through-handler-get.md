---
title: "rackup: Handler::Node loads through Handler.get, not an eager index import"
status: draft
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9691 moved `Handler::Node` to `packages/rackup/src/handler/node.ts`. That file seats itself and registers at its bottom: `Handler.Node = Node; Handler.register("node", Node)`. The registration matches rackup's own handlers (`vendor/rackup/v2.2.1/lib/rackup/handler/webrick.rb`). What deviates is the loading: `packages/rackup/src/index.ts` imports `./handler/node.js` eagerly, so every caller can read `Handler.Node` synchronously.

Rackup loads no handler when `require "rackup"` runs. A handler is reached through `Rackup::Handler.get(name)` / `.default` (`vendor/rackup/v2.2.1/lib/rackup/handler.rb:14-112`), which requires `rackup/handler/<name>` on demand, and `Rackup::Server#server` is `@_server ||= Handler.get(options[:server]) || Handler.default` (`vendor/rackup/v2.2.1/lib/rackup/server.rb:344-346`).

These call sites read `Handler.Node` directly instead of going through `Handler.get`:

- `packages/trailties/src/commands/server.ts` (`perform` and `server()`; `server()` is covered by `rails-server-extends-rackup-server`)
- `packages/trailties/src/server/boot.ts`
- `packages/trailties/src/server/vite-plugin.ts`
- `packages/actionpack/src/action-dispatch/system-testing/server.ts`

## Acceptance criteria

- [ ] `packages/rackup/src/index.ts` no longer imports `./handler/node.js`. The handler loads only through `Handler.loadPath["rackup/handler/node"]` when `Handler.get("node")` (or `.default`) asks for it.
- [ ] The non-test callers above reach the handler through `await Handler.get("node")` or `Handler.default()`, as Rails' `Rails::Server < Rackup::Server` does through `#server`, rather than through a static `Handler.Node` read.
- [ ] Tests that only want a running server may import `@blazetrails/rackup/handler/node` (or call `Handler.get`). They don't depend on the eager import.
