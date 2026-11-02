---
title: "A manifest loader's reload walks the file system"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Loader#reload` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:233-246`) ends in `setup`, whose comment says it picks any changes in the file system. A manifest-booted loader with reloading enabled re-runs `_defineAutoloadsFromManifest` (`packages/zeitwerk/src/loader.ts`) and reads the same manifest, so a file added or removed since `trails build` is not seen until the next build.

## Acceptance criteria

- After `reload`, a reloading manifest loader sees files added and removed since the build, by walking its roots as `setup` does (`defineAutoloadsForDir`).
- A real `node` subprocess test adds a file between boots and reads its constant after `reload`.
