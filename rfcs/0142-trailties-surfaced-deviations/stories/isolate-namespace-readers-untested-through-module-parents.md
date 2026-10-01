---
title: "isolate_namespace's module readers are not exercised through module_parents"
status: draft
updated: 2026-10-01
rfc: "0142-trailties-surfaced-deviations"
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

trails#8339 ported `Rails::Engine.isolate_namespace`
(`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:385-421`) as
`Engine.isolateNamespace(mod)` (`packages/trailties/src/engine.ts`). It defines
`trailtieNamespace`, `tableNamePrefix`, `useRelativeModelNaming`,
`trailtieHelpersPaths` and `trailtieRoutesUrlHelpers` on `mod`, and the only
coverage is `engine.trails.test.ts` reading them straight off the object plus
actionpack's `EngineControllerTests`, which needs only `default_scope`.

Nothing checks that the readers are reached the way Rails reaches them, through
`module_parents`:

- `ActiveModel::Naming#model_name` (`activemodel/lib/active_model/naming.rb:271-276`)
  — trails `packages/activemodel/src/naming.ts:22-34` resolves each parent with
  `safeConstantize`.
- `ModelSchema.full_table_name_prefix`
  (`activerecord/lib/active_record/model_schema.rb`) — trails
  `packages/activerecord/src/model-schema.ts:284-291` via `moduleParents`.
- `AbstractController::Railties::RoutesHelpers`
  (`actionpack/lib/abstract_controller/railties/routes_helpers.rb`) — trails
  `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:138-150`.

In both tests `mod` is a bare `{ name }` object that is not registered as a
constant, so a model or controller named `Blog::Post` would not find it.
`railtie.helpers_paths` is also async in trails (`engine.ts` `helpersPaths()`
returns a Promise) where Rails' reader is synchronous.

## Acceptance criteria

- The isolated-engine cases of `railties/test/railties/engine_test.rb`
  ("isolated engine routes and helpers are isolated", "isolated engine can be
  mounted under a namespace", the `table_name_prefix` / `use_relative_model_naming?`
  cases) are ported, with the namespace seated where `constantize` /
  `moduleParents` find it.
- A model under an isolated namespace gets the engine's table-name prefix and
  relative `param_key` / `route_key`; a controller under it gets the engine's
  url helpers.
