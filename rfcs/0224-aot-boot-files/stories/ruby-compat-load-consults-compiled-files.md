---
title: "Kernel#load and #require consult a map of compiled files before import(url)"
status: in-progress
updated: 2026-11-08
rfc: "0224-aot-boot-files"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9863
claim: "2026-11-08T12:40:56Z"
assignee: "ruby-compat-load-consults-compiled-files"
blocked-by: null
closed-reason: null
---

## Context

RFC 0224: a compiled build can't follow `import(pathToFileURL(x).href)`.
`rbFLoad` and `rbFRequireFile` (`packages/ruby-compat/lib/load.ts`) are the one
place every boot site will load through.

## Change

Add `registerCompiledFiles(root, { "rel/path.ts": () => import("...") })`.
It resolves each key against `root` and stores the thunks in a map. `rbFLoad` and
`rbFRequireFile` check the map before `import(url)`, on a file's first load
only. A reload that busts the cache (`?load=N`) still goes through
`import(url)`. Mark it `@noRailsEquivalent PERMANENT`, citing the root
`CLAUDE.md` section that RFC 0213 added.

## Acceptance

- A registered path is loaded through its thunk and never through `import(url)`.
- An unregistered path, or a second load, behaves exactly as today.
- `require` still returns `false` for a feature that was already loaded.
