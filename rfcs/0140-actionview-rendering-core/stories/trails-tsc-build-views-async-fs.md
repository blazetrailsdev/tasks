---
title: "trails-tsc: buildViews uses async fs and its callers await it"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8339
claim: "2026-10-01T16:56:27Z"
assignee: "red-fcbc702b"
blocked-by: null
closed-reason: null
---

## Context

`buildViews` (`packages/trails-tsc/src/build-views.ts`) is synchronous and uses `node:fs`'s sync API throughout: `readFileSync`, `writeFileSync`, `readdirSync`, `existsSync`, `rmSync`, `mkdirSync`, `realpathSync`. PR #8296 added more of the same in the view-scope code (`allHelpersFromPath`, `allControllers`, `templateScope`, `writeShim`), so it could match the existing sync function.

`runCli` / `watchViews` in the same package and `buildConfiguredViews` in `packages/activerecord-cli/src/tsc-wrapper/cli.ts` call it synchronously. The repo's port rules call for async fs.

This is TS-only tooling with no Rails counterpart.

## Converged shape

`buildViews` becomes `async` and uses `fs/promises`, or ruby-compat's `getFs()` adapter where the package allows it. Its callers await it: `runCli`'s `build` arm, `watchViews`' rebuild, and `trails-tsc`'s `main` / `handleBuildMode` (already `async`).

## Acceptance criteria

- [ ] No sync fs calls remain in `build-views.ts`.
- [ ] `build-views.test.ts`, `watch-views.test.ts` and the activerecord-cli `.tse views` test await the build and still pass.
