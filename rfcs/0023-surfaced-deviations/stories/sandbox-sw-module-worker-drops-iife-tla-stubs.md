---
title: "Build the sandbox service worker as an ES module worker to drop the IIFE top-level-await stubs"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity convergence: website service-worker bundling format (IIFE vs ES module) and its stub aliases are build tooling, not a divergence from any Rails behavior."
---

## Context

The sandbox service worker is bundled as IIFE
(`packages/website/vite.sw.config.ts`, `build.lib.formats: ["iife"]`) because
`prependImportScripts()` injects `importScripts("/sql-wasm.js")`, which is
classic-worker-only. Rollup cannot emit top-level await in IIFE, so every
dependency that uses TLA has to be aliased away behind a stub:

- `packages/website/src/stubs/nokogiri-stub.ts` — libxml2-wasm. Every export
  throws `"nokogiri not available in service worker"`, so XML/SAX parsing is
  simply dead in the sandbox.
- `packages/website/src/stubs/yaml-stub.ts` — added by #6083 for
  `packages/activesupport/src/yaml.ts`, whose optional-dependency resolver
  (`const yaml = await import("yaml").catch(...)`) is a top-level await.

This is a tripwire, not a stable state: the Website job went red on `main` for
two consecutive commits (`f6b381cd`, `34a70d3`) because #6078 added a TLA to a
module the SW transitively imports. Nothing warns at authoring time — the
failure only surfaces in the `Build SvelteKit` CI step, and the fix each time is
another stub.

## Acceptance criteria

- The sandbox SW builds as an ES module worker (`formats: ["es"]`), registered
  with `{ type: "module" }` in
  `packages/website/src/lib/frontiers/sw-client.ts:37`.
- `importScripts("/sql-wasm.js")` is replaced with a static import (module
  workers forbid `importScripts`), and `prependImportScripts()` is deleted from
  `vite.sw.config.ts`.
- `src/stubs/yaml-stub.ts` and its alias are deleted; the SW consumes
  `@blazetrails/activesupport/yaml` directly, restoring the optional-dependency
  miss handling that the stub bypasses.
- `src/stubs/nokogiri-stub.ts` and its alias are deleted, restoring real XML/SAX
  parsing in the sandbox rather than a throwing stub.
- `pnpm --filter @blazetrails/website run build:sw` and `vite build` pass, and
  the sandbox still boots (`/~dev/` scope) with SQLite working.

Not a Rails-fidelity item: `packages/website` has no Rails counterpart. Filed
here as the catch-all because no website/build RFC exists.
