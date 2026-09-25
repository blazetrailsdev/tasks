---
title: "The eager app scan registers app/controllers but not app/models, so every app hand-writes a model registry"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. trailmap has to hand-write a model
barrel, `app/models/index.ts:15-17`:

```ts
const MODELS = [Rfc, Story, StoryDep, StoryRfcDep, StoryPath, StoryPackage, Event, Meta];
registerModel(MODELS);
```

It also has to enforce "import the barrel, never a model module, anywhere an
association is traversed". `test/models/barrel-registration.test.ts:74-80`
asserts that a model imported without the barrel throws
`Missing model class StoryDep` on its first association read. Every trails app
with a string-named association target (`belongsTo("rfc")`,
`hasMany("deps", { through: "storyDeps" })`) inherits this chore. A Rails app
never writes it.

trails' settled answer to Zeitwerk is the eager directory scan (CLAUDE.md
"Trails has no autoloader"; `port-eager-load-autoloader-arms`, closed as
ratified). But that scan covers controllers only.
`packages/trailties/src/application/finisher.ts:61-65` (`setup_main_autoloader`)
seeds `controllerConstants` from `loadControllers` (`:148`), which globs
`app/controllers` for `*-controller.ts`. Nothing scans `app/models`, so the
model registry that `registerModel` fills is left for the app to populate by
hand.

Rails loads `app/models` through the same autoloader as `app/controllers`
(`railties/lib/rails/application/finisher.rb:76-88`, the `eager_load!`
initializer; `app/*` are all `eager_load_paths`). So a string association
target resolves by constant lookup with no app-side registration.

## Acceptance criteria

- The `setup_main_autoloader` scan also walks every existent `app/models`
  directory, including `app/models/concerns`, which it skips as Rails' concern
  roots do. It imports each model module and registers every exported
  ActiveRecord class with the same registry `registerModel` writes.
- It is the same ratified eager-scan shape as `loadControllers`, with no new
  autoloader, and carries the same `@noRailsEquivalent PERMANENT` receipt
  pointing at CLAUDE.md "Trails has no autoloader".
- A boot-app fixture test in trailties defines two models whose association
  names the other by string, imports neither module directly, and traverses
  the association after `Trails.initialize()`.
- After a trailmap re-vendor, trailmap can delete `registerModel(MODELS)` and
  the barrel's import rule. That removal is tracked by trailmap's own story,
  not here.
