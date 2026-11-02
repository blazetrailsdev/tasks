---
title: "A built manifest boots with no file system"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9588 writes nested rows to `manifest.json`, but `_defineAutoloadsFromManifest` (`packages/zeitwerk/src/loader.ts`) skips them, and `namespaceDirs` holds directories. Ruby's `on_namespace_loaded` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb`) then calls `define_autoloads_for_dir`, which needs a file system. `Config#pushDir` also stats its directory (`config.rb` `push_dir`). RFC 0213 § "The ratified deviation" and § "Risks" require a built manifest to boot with no file system.

## Acceptance criteria

- With `Loader#manifest` set, a namespace's load defines its children from manifest rows, with no directory read.
- `pushDir` performs no stat with a manifest set.
- `eager_load` runs through `imports.generated.js`.
- A test boots a built manifest on an fs adapter that raises on every read.
