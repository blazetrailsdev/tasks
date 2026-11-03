---
title: "Manifest records files under ignored dirs so a missing one does not exist"
status: ready
updated: 2026-11-03
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

trails#9654: with a manifest set up, `_isExist` (`packages/zeitwerk/src/loader/helpers.ts`) answers true for any path below a recorded ignored path, so `loadFile("ignored_dir/nope.js")` raises "is ignored". Zeitwerk checks `File.exist?` first and raises "does not exist" (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/eager_load.rb:121-130`). The manifest (`packages/zeitwerk/src/loader/manifest.ts` `buildManifest`) does not record what is inside an ignored directory.

## Acceptance criteria

- `buildManifest` records the files under each ignored directory, and `_isExist` answers from those entries, not from a path prefix.
- On an fs adapter that raises on every read, `loadFile("ignored_dir/nope.js")` raises "does not exist" and `loadFile("ignored_dir/x.js")` raises "is ignored".
