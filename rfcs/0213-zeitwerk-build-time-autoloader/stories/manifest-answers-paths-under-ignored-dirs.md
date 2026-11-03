---
title: "Manifest answers a path under an ignored directory as ignored"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9640 records the ignored paths the walk expanded in the manifest (`packages/zeitwerk/src/loader/manifest.ts` `buildManifest`, refilled in `_defineAutoloadsFromManifest`, `packages/zeitwerk/src/loader.ts`). A file under an ignored directory is not a row, so with a manifest set up `loadFile` raises "does not exist" for it (`_isExist` answers from `_manifestChildren`). Rails raises "is ignored": `load_file` walks up and raises at `ignored_path?(dir)` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/eager_load.rb:121-130`), and `cpath_expected_at` answers nil (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:284`).

## Converged shape

`_isExist` / `isDir` under a manifest answer for any path below a recorded ignored directory: a recorded ignored path is a prefix, so `loadFile` reaches the walk-up `isIgnoredPath(dir)` raise as Ruby does. CLAUDE.md § "`Module#autoload` is a build step" drops "under an ignored directory".

## Acceptance criteria

- On an fs adapter that raises on every read, `loadFile("ignored_dir/x.js")` raises "is ignored" and `cpathExpectedAt` answers null.
