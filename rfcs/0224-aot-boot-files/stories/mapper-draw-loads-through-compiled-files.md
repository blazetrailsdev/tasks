---
title: "mapper-draw-loads-through-compiled-files"
status: ready
updated: 2026-11-08
rfc: "0224-aot-boot-files"
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

`Mapper#draw` (`packages/actionpack/lib/action-dispatch/routing/mapper.ts:1413`)
still loads `config/routes/<name>.ts` with `import(pathToFileURL(...))` and
calls its lowercase `drawRoutes` export. Rails is
`instance_eval(File.read(path_for_routes(name)), ...)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`, `draw`).
`rbFLoad` (`packages/ruby-compat/lib/load.ts:41`) returns `true` and seats only
constant-named exports, so the site cannot read `drawRoutes` through it.
The action-controller trailtie's `helperConstants`
(`packages/trailties/src/trailties/action-controller.ts:177`) has the same
shape: it reads `mod[demodulize(name)]` from each helper file. Reading the
seated `TopLevel` constant instead is wrong: `admin/users_helper.ts` and
`users_helper.ts` both seat `UsersHelper`, and a repeat `rbFRequireFile`
seats nothing (trails#9867 review). Split out of
`boot-sites-load-through-kernel-load`.

## Acceptance criteria

- `Mapper#draw` reaches a sub-routes file through the `registerCompiledFiles` map.
- A test shows a registered thunk is used for a drawn sub-routes file.
- The helpers site reaches each helper file through the map, reading that
  file's own export, with a test covering a namespaced and a top-level helper
  of the same short name and a repeated call.
- No direct `import(pathToFileURL` remains in `Mapper#draw` or `helperConstants`.
