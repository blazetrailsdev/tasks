---
title: "AppBase#builder skips a standalone AppBuilder's own constructor (Reflect.construct)"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

`AppBase#builder` (`railties/lib/rails/generators/app_base.rb:162-168`) does
`builder_class.include(ActionMethods); builder_class.new(self)`. Ruby resolves `initialize` through the
ancestry, so a user `::AppBuilder` runs its own `initialize` when it defines one, and otherwise
`ActionMethods#initialize(generator)`.

trails' `builder()` (`packages/trailties/src/generators/app-base.ts`) includes `Trails.ActionMethods`,
then:

- For a class that extends `ActionMethods` (trails' `AppBuilder` and its subclasses), it calls
  `new builderClass(this)`, which is exact.
- For a standalone class, it calls `Reflect.construct(Trails.ActionMethods, [this], builderClass)`,
  because a JS mixin cannot add an argument-taking constructor to a class chain. That skips the
  standalone class's own constructor and field initializers.

## Converged shape

A standalone builder is built by `new builderClass(this)`. `ActionMethods#initialize(generator)` runs
when the class's constructor chain reaches it, as in Ruby. That likely means extending ruby-compat's
`include()` `[initialize]` hook to carry constructor arguments.

## Acceptance criteria

- A standalone `TopLevel.AppBuilder` with its own constructor and class fields has both run.
- One without a constructor still receives `generator` and `options`.
