---
title: "The boot sites that load app files by path go through rbFLoad / rbFRequireFile"
status: ready
updated: 2026-11-08
rfc: "0224-aot-boot-files"
cluster: null
packages: ["trailties", "actionpack"]
deps: ["ruby-compat-load-consults-compiled-files"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0224 lists eight sites that load application files with their own
`import(pathToFileURL(...))`: `RoutesReloader#loadPaths`, `Mapper#draw`,
`load_environment_config`, `loadConfigInitializer`, `configFor`, `database`,
the action-controller trailtie's helpers, and `loadSeed`.

## Change

Each site calls `rbFLoad` (routes, sub-routes, initializers, seeds) or
`rbFRequireFile` (environments, helpers) instead, which matches Rails'
`load`/`require`. Leave `configFor` and `database` on their own reads unless the
RFC's open question gets settled first.

## Acceptance

- None of the eight sites calls `import(pathToFileURL` directly.
- Existing boot, routes-reload and seed tests pass unchanged.
- One test per site shows that a `registerCompiledFiles` thunk is used.
