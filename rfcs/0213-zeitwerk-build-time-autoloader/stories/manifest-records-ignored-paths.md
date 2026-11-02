---
title: "Manifest records ignored paths so load_file raises is ignored"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With a manifest set up, `expandGlobPatterns` (`packages/zeitwerk/src/loader/config.ts`) returns nothing, so `ignoredPaths` is empty, and ignored paths are absent from the manifest rows. `loadFile` and `cpathExpectedAt` therefore raise "does not exist" for an ignored path, and `actualRoots` cannot skip an ignored root. Rails: `load_file` raises "is ignored" (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/eager_load.rb:121`), `cpath_expected_at` returns nil (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:284`). `collapsed` was recorded in the manifest and refilled in `setup` for the same reason (trails#9633).

## Acceptance criteria

- `buildManifest` records the ignored paths; `setup` refills `ignoredPaths` from them and indexes them in `_manifestChildren` as existing.
- On an fs adapter that raises on every read, `loadFile` raises "is ignored" and `cpathExpectedAt` answers null for an ignored path.
- The sentence in CLAUDE.md § "`Module#autoload` is a build step" narrows accordingly.
