---
title: "Mapper#draw's path search finds a registered compiled routes file"
status: done
updated: 2026-11-08
rfc: "0224-aot-boot-files"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: trails#9884
claim: "2026-11-08T20:45:20Z"
assignee: "mapper-draw-path-search-consults-compiled-files"
blocked-by: null
closed-reason: null
---

## Context

`Mapper#draw` (`packages/actionpack/lib/action-dispatch/routing/mapper.ts`, `draw`) now
evaluates the routes file through `loadIseqEval` (trails#9876), so a
`registerCompiledFiles` thunk answers its first evaluation. But the search before
it still asks the disk: `fs.exists` on `${_path}/${name}.ts`, the port of
`File.exist? "#{_path}/#{name}.rb"`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1669-1671`).
A built app that ships no `.ts` source raises "Your router tried to #draw the
external file" even though the file is registered. `rbFRequireFile`
(`packages/ruby-compat/lib/load.ts`) already treats a registered path as
existing (`compiledFiles.has(full) || File.isExistAsync(full)`). Also, a second
repeat draw in such a build falls through to disk (`loadIseqEval(.., true)` skips the
thunk once loaded), matching `rbFLoad`'s pinned semantics.

## Acceptance criteria

- `Mapper#draw`'s path search answers true for a path registered through
  `registerCompiledFiles`, the same existence rule `rbFRequireFile` uses, with
  the Rails control flow (find, then raise `ArgumentError`) unchanged.
- A sourceless repeat `draw` is decided: either the thunk answers a re-evaluation
  when no file exists on disk, or the limit is recorded with its reason.
- A test draws a registered sub-routes file with no file on disk.
