---
title: "A Concern's included hook does not typecheck on a Module, and include() does not type the methods it adds"
status: draft
updated: 2026-11-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#82 (`LoopbackOnly`, `app/controllers/concerns/loopback-only.ts`). Rails writes `module LoopbackOnly; extend ActiveSupport::Concern; included { before_action :require_loopback }; def require_loopback ... end; end`. In trails:

- `Concern.included.call(mod, null, fn)` on `new Module(...)` fails to typecheck: TS2559, "Type 'Module<...>' has no properties in common with type 'ConcernHost'" (`activesupport/dist/concern.d.ts`). actionpack's own `Callbacks` module calls `mod.included(...)` after `extend(mod, Concern)`, untyped JS. trailmap fell back to a plain object with an `[included]` symbol hook.
- `include(this, LoopbackOnly)` does not add `requireLoopback` to the class's instance type. trailmap needed `export interface ApiController extends LoopbackOnlyMethods {}`.
- The `beforeAction` block receives `ActionController.Base`, not the including class, so calling the mixed-in method needs a cast: `(controller as ActionController.Base & LoopbackOnlyMethods).requireLoopback()`.

Also hit by trails#9425 on plain-object modules, the first shape the repo now reaches for: after `extend(Likeable, Concern)`, `examples/twelve-dollar-server/app/models/concerns/post/likeable.ts` declares a local `Concern` type to call `(Likeable as unknown as Concern).included(...)`, `app/controllers/concerns/authentication.ts` does the same for `included` and `classMethods`, and each includer needs an `interface X extends Included<...>` merge with an eslint-disable line.

## Acceptance criteria

- A `Module` extended with `Concern` exposes a typed `included(block)` that typechecks with no cast.
- `include(klass, mod)` types the module's instance methods onto the class, or there is a documented typed helper that does.
- A `beforeAction` block registered from an `included` hook can call the concern's method with no cast.
- A plain-object module extended with `Concern` exposes typed `included` and `classMethods`, and `examples/twelve-dollar-server` drops its local `Concern` types, its `as unknown as Concern` casts and its `Included<>` eslint-disable lines.
