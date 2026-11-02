---
title: "trails server says nothing once the socket is bound"
status: draft
updated: 2026-11-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/commands/server.ts` `ServerCommand#perform` (dist/commands/server.js:219-224 at 945a06ff5b) prints the boot banner before `await server.start(...)`, and `packages/rack/src/handler/node.ts` `Node.run` (dist/handler/node.js:38-40) resolves on `listen` without printing anything. So no output means the socket is bound. In Rails the banner also precedes the start, but Puma then prints "Listening on ...". The older post-bind banner in trailties `server/boot.js:40` is not on this path. trailmap's `scripts/smoke-boot.sh` had to fall back to polling the port with curl.

## Acceptance criteria

- `trails server` writes a line after the socket is bound, naming the bound address, matching Puma's "Listening on" as the Rails-side counterpart.
- A failed bind (EADDRINUSE) never prints that line.
- A trailties or rack test covers both cases.
