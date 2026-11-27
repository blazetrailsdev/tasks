---
title: "Playground type-check worker shares the TypeScript chunk and slims declarations"
status: ready
updated: 2026-11-27
rfc: "0247-website-refresh"
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

Since trails#10828, the type-check worker (`examples/browser-sqlite/src/host/type-check.worker.ts`) is bundled with its own copy of `typescript-5`: `dist/assets/type-check.worker-*.js` is about 4 MB, next to the runtime's `typescript-*.js`, which is also about 4 MB. Vite's worker bundle (`worker: { format: "es" }` in `vite.config.ts`) shares no chunks with the main graph. The declarations chunk (`_trails-declarations-*.js`) is 7.5 MB of uncompressed JSON-in-JS.

## Acceptance criteria

- A typical visit downloads TypeScript once, for example by running the checker in the runtime frame or by having the worker load the shared chunk through its URL.
- The declarations payload is measured and shrunk: skip declarations no app import can reach, or strip comments.
