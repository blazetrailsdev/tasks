---
title: "trailmap's image boots the compiled build, with no tsx at run time"
status: draft
updated: 2026-11-25
rfc: "0136-trailmap"
cluster: null
packages: []
deps: ["generated-app-boots-compiled-without-tsx"]
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

trailmap's production server runs its TypeScript source through tsx:

- `bin/trails` is a node shim that spawns `node_modules/.bin/tsx bin/trails.ts`.
- The image boots with `CMD ["./bin/trails", "server", "-b", "0.0.0.0", "-p", "8080"]`
  (`Dockerfile:90`). tsx is a devDependency, but the image installs dev
  dependencies, so it ships.
- The Dockerfile already builds `dist/` (`pnpm run build`, `Dockerfile:36`)
  without running it. Its comment (`Dockerfile:31-35`) says the switch waits
  on trails' closed `compiled-app-cannot-boot-without-tsx`. That work is now
  RFC 0258-ship-compiled-javascript.

## Acceptance criteria

- The image's CMD boots the compiled build. No `.ts` file is loaded at run time.
- `bin/trails` no longer spawns tsx. It follows the shape the generated app
  ships once 0258 lands.
- The runtime stage is installed with production dependencies only, and tsx is
  absent from it. The `package.json` scripts that still use tsx (the `gate*`
  and `ringo:*` dev scripts) are dev tooling and may keep it, or move to
  `node` with type stripping.
- The `Dockerfile:31-35` comment is removed.
- CI's boot job passes against the new image.
