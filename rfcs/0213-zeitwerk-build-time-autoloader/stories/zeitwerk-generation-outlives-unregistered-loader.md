---
title: "Keep a file's reload generation across unregister"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - zeitwerk-reload-and-unload
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

`Loader#unload` deletes files from `$LOADED_FEATURES` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:154-226`), a process-wide table, so any later loader re-evaluates them; `unregister` is documented as pairing with `unload` (`loader.rb:150-153`, `:351-355`). In trails the generation is per loader (`packages/zeitwerk/src/loader.ts`, `_generation`; `packages/zeitwerk/src/core-ext/kernel.ts`, `require` and `_installResolveHook`), while ESM's module cache is keyed by URL. After `unload` + `unregister`, a new `Loader` on the same root starts at generation 1, imports the query-less URL and gets the old class.

## Acceptance criteria

- A file's generation outlives its loader, the way `$LOADED_FEATURES` removal does in Ruby: `unload`, `unregister`, then a new loader on the same root re-evaluates the file.
- A real `node` subprocess test shows that sequence yielding a new class, through both `require` and a static import.
