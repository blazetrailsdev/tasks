---
title: "trails build output loads in a Rollup bundle with inlineDynamicImports"
status: ready
updated: 2026-11-19
rfc: "0241-request-path-performance"
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

Even after trails#10324, a Rollup build with `output.inlineDynamicImports: true` (Vite's default for an SSR `webworker` target, `vite/dist/node/chunks/config.js` `buildOutputOptions`) still fails. Rollup evaluates every inlined dynamically-imported module at bundle load. So `config/routes.ts`, reached through `.trails/boot.generated.js`'s `registerCompiledFiles` thunks, runs before `config/application.ts` has called `Application.register`, and fails with `TypeError: Cannot read properties of null (reading 'routes')`. Cloudflare-style webworker targets need this mode.

## Acceptance criteria

- Find out which generated boot or config modules are order-sensitive when inlined. Make `trails build`'s generated files (`packages/trails-tsc/lib/build-autoload.ts`) load correctly when every dynamic import is inlined.
- Extend `check:vite` with an `inlineDynamicImports: true` run that serves `GET /posts`.
