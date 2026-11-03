---
title: "rackup: Handler::Node moves out of @blazetrails/rack"
status: ready
updated: 2026-11-03
rfc: "0000-rackup-gem-port"
cluster: null
packages: ["rackup", "rack", "trailties"]
deps: ["port-rackup-server-for-rails-server"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack 3 has no `Rack::Handler`; handlers live in `Rackup::Handler`
(rackup 2.2.1 `lib/rackup/handler.rb:14-112`). trails' Node HTTP server is
`packages/rack/src/handler/node.ts`, exported from rack as `Handler`
(`packages/rack/src/handler/index.ts`, `packages/rack/src/index.ts`). The
first rackup PR registers it from rackup with
`Handler.register("node", RackHandler.Node)` (`packages/rackup/src/handler/node.ts`),
which leaves the class in rack.

## Acceptance criteria

- [ ] The handler lives at `packages/rackup/src/handler/node.ts` as
      `Rackup::Handler::Node`, registered at the bottom of its own file as a
      rackup handler gem does.
- [ ] `packages/rack/src/handler/` and rack's `Handler` export are deleted;
      every caller (trailties `commands/server.ts`, `server/dev-server.ts`,
      tests) imports from `@blazetrails/rackup`.
- [ ] `node.test.ts` moves with it, unchanged in intent.
- [ ] `pnpm parity:api:extra --package rack` no longer lists `Handler`.
