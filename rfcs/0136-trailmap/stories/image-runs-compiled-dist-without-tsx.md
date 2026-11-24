---
title: "The trailmap image runs its compiled dist/ under plain node, with no tsx or typescript at run time"
status: draft
updated: 2026-11-24
rfc: "0136-trailmap"
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

The image runs `bin/trails`, which execs `node_modules/.bin/tsx` on
`bin/trails.ts`. `bin/jobs` and the Procfile's `release` (`db:prepare`) also
run source. trailmap#198 kept `pnpm run build` in the image so `dist/` is
always emitted from what ships, but nothing runs it yet. `tsx`, `typescript`,
vite and vitest therefore all ship in the runtime stage (image 605MB).

Blocked on trails RFC 0258 (`0258-ship-compiled-javascript`, tasks#376):
booting `dist/` under plain node exits with `configuration config.ts not
found` (`trailties/lib/application.ts:149`, `findRootWithFlag("config.ts")`),
and the server's `--config` default is `config.ts`
(`trailties/lib/commands/server.ts:209`).

## Acceptance

After RFC 0258 lands and trails is re-vendored, in its own PR:

- `bin/` is included in `tsconfig.json`, so `dist/bin/trails.js` and
  `dist/bin/jobs.js` are emitted.
- The Dockerfile's `CMD`, the Procfile's `web`, `worker` and `release`, and
  `scripts/smoke-image.sh` run `dist/` under
  `node --no-experimental-strip-types`.
- The runtime stage installs production dependencies only, and the PR shows
  that neither `tsx` nor `typescript` resolves in the image. Give the image
  size before and after.
- `rails/DEVIATIONS.md` needs no entry, since Rails has no compile step to
  deviate from.
