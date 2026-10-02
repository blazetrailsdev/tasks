---
title: "trails server's Vite dev path forwards upgrade requests to the Rack handler"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["trailties"]
deps: ["rack-handler-node-offers-rack-hijack-on-upgrade"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails server` has two paths (`packages/trailties/src/commands/server.ts:34,44`):
`Handler.Node.run` and, in development, `DevServer`
(`packages/trailties/src/server/dev-server.ts:37-48`), which starts Vite with
`trailsPlugin`. The plugin (`packages/trailties/src/server/vite-plugin.ts:17-27`)
installs one connect middleware that calls `handler.service(req, res)`. A
connect middleware never sees an upgrade request: Node emits `upgrade` on
`server.httpServer`, where Vite's own HMR WebSocket is the only listener.

So in development `/cable` would never reach `ActionCable.server`, while it
works under `Handler.Node.run`. Rails has one server path
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/engine.rb:62-70` mounts the cable server in the application's routes,
and Puma hands it the hijack), so the dev path has to behave the same.

This story registers an `upgrade` listener on `server.httpServer` in
`configureServer` that hands the request to the handler's upgrade path from
`rack-handler-node-offers-rack-hijack-on-upgrade`.

`0142/trails-server-adapts-application-to-function-rack-app` (draft) touches
`commands/server.ts`, not the plugin; no overlap.

## Fidelity traps (predicted at authoring)

- [ ] **Vite's HMR socket shares the server.** Vite handles an upgrade only when `Sec-WebSocket-Protocol` is `vite-hmr` or `vite-ping`. The trails listener must leave those alone and take the rest, or HMR breaks.
- [ ] **`httpServer` is null in middleware mode.** `dev-server.ts:52` already guards it. Do the same.
- [ ] **Listener lifetime.** `DevServer#stop` (`dev-server.ts:63-68`) closes Vite. A listener that outlives a restart double-handles the next upgrade.

## Acceptance criteria

- [ ] With the dev server running, a WebSocket upgrade to a mounted Rack app reaches it with `rack.hijack?` true, and Vite's HMR client still connects.
- [ ] The dev path and `Handler.Node.run` share one upgrade implementation in `packages/rack`; the plugin only routes.
- [ ] A test starts `DevServer` on an ephemeral port and upgrades against it.

## Definition of done

A second WebSocket server inside the plugin (one that never calls the Rack app) does not close this story.

## Verification

```bash
pnpm vitest run packages/trailties/src/server
```
