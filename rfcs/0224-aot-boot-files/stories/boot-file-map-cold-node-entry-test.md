---
title: "Cold-node boot test of .trails/entry.generated.js covering an out-of-root engine"
status: draft
updated: 2026-11-08
rfc: "0224-aot-boot-files"
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

trails#9871 made `buildAutoload` (`packages/trails-tsc/lib/build-autoload.ts`, `writeBoot`) write `.trails/boot.generated.js`, which `install.generated.js` imports first. Its test (`packages/trails-tsc/test/build-autoload.trails.test.ts`, "writes a boot file that registers the routes, environments, initializers and seeds") runs under vitest. Vitest gave the generated file its own copy of `@blazetrails/ruby-compat`, so the test swaps in a wrapper for `registerCompiledFiles` with `vi.doMock`. Nothing yet runs the built `.trails/entry.generated.js` under plain `node` to show that the boot sites (`RoutesReloader#loadPaths`, `load_environment_config`, `load_config_initializers`, `Engine#loadSeed` in `packages/trailties/src/engine.ts:330,420,456,499`) take the registered thunks. The engine case only covers an engine root inside the app, so no key starts with `../`. `BOOT_PATHS` repeats the path keys from `packages/trailties/src/engine/configuration.ts:64-71`.

## Acceptance criteria

- A test that builds a small app (routes, one environment, one initializer, seeds, and an engine whose root is outside the app root) and boots `.trails/entry.generated.js` in a child `node` process. It asserts that every boot-site file was loaded through its registered thunk before `Trails.initialize()` drew the routes.
- The engine's keys come out as `../`-relative and resolve at boot.
