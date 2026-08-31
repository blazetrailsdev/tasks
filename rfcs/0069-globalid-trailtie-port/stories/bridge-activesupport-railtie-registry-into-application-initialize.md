---
title: "Application#initialize never runs the activesupport Railtie registry, so no framework initializer fires in a booted app"
status: draft
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
packages: ["activesupport", "trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails has two Railtie ports of the same Ruby class, and nothing bridges them:

- `packages/activesupport/src/railtie.ts` — `Railtie` with the static
  `subclasses` / `initializer` / `runInitializers` / `runAllInitializers`
  registry. Every framework railtie extends it: `activemodel/src/trailtie.ts`,
  `activerecord/src/trailtie.ts`, `globalid/src/trailtie.ts`,
  `actionpack/src/action-dispatch/trailtie.ts`, `actionview/src/trailtie.ts`.
- `packages/trailties/src/trailtie.ts` — `Trailtie extends Initializable`, with
  its own `_registry` and the `Initializable#runInitializers(group, *args)`
  ported from `railties/lib/rails/initializable.rb:60-63`.

`Application#initialize` (`packages/trailties/src/application.ts:152`) calls
`this.runInitializers(group, this)` — the `Initializable` one. It never calls
`Railtie.runAllInitializers`, so in a booted app **no framework railtie
initializer runs at all**: the only call sites of the activesupport registry's
runners are `railtie.test.ts` and the per-package `trailtie.test.ts` /
`trailtie.trails.test.ts` files, which drive them directly.

Surfaced reviewing PR #7301, which made `Railtie.initializer`'s block receive
the app (`initializable.rb:31-33`, `:60-63`) so globalid's and activerecord's
initializers can read it. That plumbing is correct and test-covered, but until
the two registries are joined a real boot passes nothing, because it never
enters the activesupport registry at all. Rails has one `Rails::Railtie`, whose
`initializers` the application collects through `Initializable::ClassMethods`
(`railties/lib/rails/application.rb`, `initializers` →
`Railtie.initializers_chain`), so the split is the deviation.

## Acceptance criteria

- [ ] A booted `Application#initialize` runs the framework railtie
      initializers, yielding the `Application` instance to each block —
      whichever direction the merge goes (activesupport's `Railtie` subsumed by
      trailties' `Trailtie`, or its registry collected into
      `Application#initializers` the way `initializers_chain` does).
- [ ] `Trailtie.config` / `Railtie.config` remain one config bag from the
      app's point of view; `Railtie.deprecators` still reaches
      `app.deprecators`.
- [ ] A test boots an `Application` and asserts a framework initializer ran
      with that instance as its argument — the case that would have caught
      this.
- [ ] Existing `RailtieTest` cases in each package keep their names and keep
      driving their Trailtie directly.
