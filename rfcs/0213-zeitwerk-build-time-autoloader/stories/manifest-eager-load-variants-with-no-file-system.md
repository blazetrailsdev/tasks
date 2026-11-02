---
title: "manifest-eager-load-variants-with-no-file-system"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#(manifest boot) makes `eagerLoad` and namespace loads work with no file system. `Loader#eagerLoadNamespace`, `#eagerLoadDir`, `#loadFile`, `#cpathExpectedAt` and `#allExpectedCpaths` (`packages/zeitwerk/src/loader.ts`, `loader/eager-load.ts`) still call `actualRoots`, `ls`, `File.isExistAsync` or `isDir`. Ruby: `vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/eager_load.rb`. Nothing wires `Loader#manifest` / `Loader#imports` in trailties boot yet either.

## Acceptance criteria

- With a manifest set up, these methods answer from manifest rows, or the story records which must raise, with no directory read.
- A test runs them on an fs adapter that raises on every read.
