---
title: "Re-vendor trails for the rackup client-disconnect worker-leak fix (trails#10829)"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10829 (merge `dbe127ade9`) fixed `packages/rackup/lib/handler/node.ts` `Node#service`. If a client disconnected before a streamed response's `close` listener was attached, the request never settled and kept one of the 5 pool workers forever (`maxThreads: 5`). trailmap production wedged on 2026-11-26: five dropped `/fleet/read/*` and `/fleet/stories` requests from a phone left the pool at spawned 5, waiting 0, and nginx returned 504 until `dokku ps:restart trailmap web`. The restarted container had 2 workers leaked within about 15 minutes, so it will wedge again until this lands.

trailmap runs the vendored `@blazetrails/rackup` from `vendor/`, pinned in `vendor/TRAILS_PIN`, which predates the fix.

## Acceptance criteria

- `scripts/vendor-trails.sh <trails-checkout> <ref>` at a trails ref that contains `dbe127ade9`, then `pnpm install`. Nothing else goes in the PR (CLAUDE.md: bumping is its own PR).
- `node_modules/@blazetrails/rackup/dist/handler/node.js` contains `if (res.destroyed) onClose();` in `service`.
- `pnpm test`, `pnpm build` and `pnpm gate` pass.
- After deploying: with the inspector open on the web process, the rackup pool shows `waiting` equal to `spawned` minus in-flight requests after clients disconnect mid-request, and no worker stays leaked.
