---
title: "Snapshot a bundled minimal trails app and measure its cold start"
status: draft
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from `spike-v8-startup-snapshot-of-a-booted-app` (trails#10337, `docs/trailties/v8-startup-snapshot-spike.md`). Node 26's `--build-snapshot` accepts only a single CJS script resolving built-in modules, refuses `import()` ("Not supported"), and require-esm refuses an async graph (`ERR_REQUIRE_ASYNC_MODULE`, first TLA `libxml2-wasm/lib/libxml2.mjs:3`). Importing `@blazetrails/trailties` alone costs 1.65 s cold; a deserialized trivial snapshot starts in 0.19 s.

Depends on the framework root graph being free of top-level await (`sanitizer-libxml2-loads-by-an-awaited-step-not-boot-tla` and siblings).

## Acceptance criteria

- Bundle a minimal booted trails app to one CJS file and build a snapshot from it with `node --build-snapshot`.
- Pools, file watchers and timers are created after deserialize (`v8.startupSnapshot.addDeserializeCallback`).
- Record cold start of the snapshotted app against the unsnapshotted boot, with a go/no-go.
