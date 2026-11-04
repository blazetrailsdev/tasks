---
title: "rackup: Handler::Node moves out of @blazetrails/rack"
status: done
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: fidelity
packages: ["rackup", "rack", "trailties"]
deps: ["rackup-package-parity-enrollment"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9691
claim: "2026-11-03T23:38:16Z"
assignee: "rackup-handler-node-moves-out-of-rack"
blocked-by: null
closed-reason: null
---

## Context

Rack 3 has no `Rack::Handler`; handlers live in `Rackup::Handler`
(rackup 2.2.1 `lib/rackup/handler.rb:14-112`). trails' Node HTTP server is
`packages/rack/src/handler/node.ts`, exported from rack as `Handler`
(`packages/rack/src/handler/index.ts`, `packages/rack/src/index.ts`), with
`@noRailsEquivalent PERMANENT` receipts on its members. Any registration of it
from rackup that an earlier PR made while the class stays in rack is folded
into the move.

## Acceptance criteria

- [ ] The handler lives at `packages/rackup/src/handler/node.ts` as
      `Rackup::Handler::Node`, registered at the bottom of its own file as a
      rackup handler gem does.
- [ ] `packages/rack/src/handler/` and rack's `Handler` export are deleted;
      every caller (trailties `commands/server.ts`, `server/dev-server.ts`,
      tests) imports from `@blazetrails/rackup`.
- [ ] `node.test.ts` moves with it, unchanged in intent.
- [ ] `pnpm parity:api:extra --package rack` no longer lists `Handler`, and
      `--package rackup` scores `Handler::Node` as `PERMANENT` (the existing
      receipts move with the file).
- [ ] `Handler::Node` does not build a `Rackup::Stream`: Node hands a hijack
      the socket itself, so the handler has no dependency on
      `rackup-stream-port`.
