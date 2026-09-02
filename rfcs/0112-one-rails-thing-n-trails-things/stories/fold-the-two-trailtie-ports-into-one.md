---
title: "activesupport Trailtie and trailties Trailtie are two ports of one Rails::Railtie"
status: ready
updated: 2026-09-02
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has one `Rails::Railtie` (`railties/lib/rails/railtie.rb:136`), which
`include Rails::Initializable` (`railtie.rb:191`) — so `initializer` registers
an `Initializable::Initializer` with `before:`/`after:`/`group:` options
(`initializable.rb:14-40`, `:80-92`) and `Application#initializers` collects
every railtie's through `initializers_chain` (`initializable.rb:76-84`).

trails has two ports of that class:

- `packages/activesupport/src/trailtie.ts` — `Trailtie`, a static registry of
  `{ name, block }` pairs with `subclasses` / `initializer` / `initializers` /
  `runInitializers` / `runAllInitializers`. Every framework railtie subclasses
  it (`activemodel/src/trailtie.ts`, `activerecord/src/trailtie.ts`,
  `globalid/src/trailtie.ts`, `actionpack/src/action-dispatch/trailtie.ts`,
  `actionpack/src/action-controller/trailtie.ts`, `actionview/src/trailtie.ts`,
  `trailties/src/trailties/active-support.ts`), because a framework package
  cannot depend on trailties.
- `packages/trailties/src/trailtie.ts` — `Trailtie extends Initializable`, the
  faithful port, with `Collection` / `Initializer` / tsort / groups.

PR #7375 bridged them rather than folding them: `Application#orderedRailties`
puts the activesupport subclasses in the `:all` bucket and
`railtiesInitializers` binds their blocks into the chain
(`packages/trailties/src/application.ts`, `application.rb:588-624`). That makes
a booted app run them, but they are still second-class — see the two follow-ups
this story blocks (no `before:`/`after:`, deprecators written to a static
registry).

## Converged shape

One `Trailtie`. The dependency direction is the whole difficulty: trailties
depends on activerecord, so the class the framework packages extend has to live
below them. The likely shape is moving `Initializable` (and `Collection` /
`Initializer`) into activesupport, where every package can reach it, and having
`activesupport`'s `Trailtie` be the real `include Initializable` port that
trailties' `Trailtie`/`Engine`/`Application` extend — deleting
`packages/trailties/src/initializable.ts`'s duplicate and the bridge loop in
`railtiesInitializers`.

## Acceptance criteria

- [ ] One `Trailtie` class; framework railties and trailties' `Engine` /
      `Application` share it.
- [ ] `Application#railtiesInitializers` is the plain `application.rb:614-624`
      body again, with no `typeof r === "function"` arm and no `OrderedRailtie`
      union.
- [ ] Framework railtie initializers accept `before:` / `after:` / `group:`.
- [ ] Existing `RailtieTest` cases in each package keep their names.
