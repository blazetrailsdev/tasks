---
title: "trailmap runs its TypeScript under plain node: .ts specifiers, no tsx"
status: in-progress
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trailmap#79
claim: "2026-10-27T00:10:02Z"
assignee: "trailmap-runs-under-plain-node"
blocked-by: null
closed-reason: null
---

## Context

trails#9354 made generated apps run their TypeScript under plain `node`. It did that with `.ts` relative specifiers, `rewriteRelativeImportExtensions` and `erasableSyntaxOnly`, and a `bin/trails` that imports `@blazetrails/trailties/commands` in-process. trailmap predates that change. It writes `./x.js` specifiers, runs everything through `tsx` (its `bin/trails` spawns it), and ships `tsx` in its production image.

So `trails-tsc-views build`, which loads `config/initializers` as Rails' `load_config_initializers` does, fails during trailmap's `prepare` with `Cannot find module '…/config/database.js'`. That is what blocks the re-vendor that brings in solid-queue.

## Acceptance criteria

- [ ] Re-vendor trails at a pin that includes trails#9354, in its own PR.
- [ ] Every relative specifier in `app/`, `config/`, `db/`, `lib/` and `test/` names the `.ts` file. `tsconfig.json` sets `rewriteRelativeImportExtensions` and `erasableSyntaxOnly`.
- [ ] Non-erasable syntax is rewritten, for example `VerbExit`'s `readonly code` parameter property.
- [ ] `bin/trails` matches the generator's: app path from its directory, then the commands imported in-process. `tsx` leaves the production image.
- [ ] `pnpm install` (`prepare`), `pnpm test`, `pnpm gate` and the image build pass with no loader.
