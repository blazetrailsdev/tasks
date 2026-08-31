---
title: "No Rack handler: serving a trails app over HTTP requires hand-rolling the env bridge"
status: done
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7244
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

There is no way to serve a trails app over HTTP outside Vite. Rack has no
`Rack::Handler` equivalent, so every app has to write its own
`node:http` ↔ `RackEnv` bridge.

The only bridge in the repo is inlined and private:
`packages/trailties/src/server/vite-plugin.ts` — `buildRackEnv(req, port)` at
line ~68 and `readBody(req)` below it. It is not exported, and the file is a
Vite plugin, so it is unreachable from a plain server.

`packages/rack/src/` has no handler directory at all — grep for
`IncomingMessage` or `http.createServer` across `packages/rack/src` and
`packages/trailties/src` matches only that one Vite plugin.

Consequences seen while building `examples/twitter-app`:

- `trails server` (`packages/trailties/src/commands/server.ts:14`) can only
  start a Vite dev server. There is no production server command.
- The example app had to write `src/server.ts` — a ~70-line copy of
  `buildRackEnv` plus `http.createServer` — purely to be testable over real
  HTTP.

Rails ships `Rack::Handler` adapters and `rails server` boots Puma through
`Rack::Server` (`vendor/rails/railties/lib/rails/commands/server/server_command.rb`).

## Acceptance criteria

- A `Rack::Handler`-equivalent lives in `@blazetrails/rack` (or trailties)
  and is exported: env construction from a Node request, response writing,
  body streaming.
- `trails server` uses it, and works without Vite.
- `vite-plugin.ts` uses the shared bridge rather than its own copy.
- `examples/twitter-app/src/server.ts` shrinks to booting the app and calling
  the handler, and its `TODO` is removed.
