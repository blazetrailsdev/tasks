---
title: "mapper-define-generate-prefix-diverges"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
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

`Mapper#defineGeneratePrefix` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`)
diverges from `define_generate_prefix`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:670-705`):

- Its `script_namer` returns the mount path, where Rails' slices the mount route's
  `segment_keys` (recalling them from `:_recall`), deletes them from the options, and
  returns `_url_helpers.public_send("#{name}_path", prefix_options)`.
- It records `{ app, scriptNamer }` in an invented `_mountedScriptNamers` map.
- It does not `app.routes.extend` the module overriding `optimize_routes_generation?`
  and `find_script_name`.

`app.routes.defineMountedHelper(name, scriptNamer)` (`:689`) is now called, so
`mounted.baz_path` works (`ApplicationIntegrationTest` "includes mounted helpers").

## Acceptance criteria

- `defineGeneratePrefix` mirrors `mapper.rb:670-705` line for line; `_mountedScriptNamers`
  is removed.
- A mounted engine route with a dynamic mount segment generates its prefix from
  `:_recall`.
