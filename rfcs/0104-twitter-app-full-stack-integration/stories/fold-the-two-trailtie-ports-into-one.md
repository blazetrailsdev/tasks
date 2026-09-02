---
title: "activesupport Trailtie and trailties Trailtie are two ports of one Rails::Railtie"
status: in-progress
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: 7413
claim: "2026-09-02T22:05:24Z"
assignee: "fold-the-two-trailtie-ports-into-one"
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

One `Trailtie`, **at its Rails path**: `railties/lib/rails/railtie.rb` ports to
`packages/trailties/src/trailtie.ts`, and `initializable.rb`,
`railtie/configuration.rb` and `railtie/configurable.rb` stay beside it. The
invented `packages/activesupport/src/trailtie.ts` is deleted.

The framework railtie ports move up to trailties instead, joining the one that
already lives there:

- `packages/trailties/src/trailties/active-model.ts`
- `packages/trailties/src/trailties/active-record.ts`
- `packages/trailties/src/trailties/action-view.ts`
- `packages/trailties/src/trailties/action-controller.ts`
- `packages/trailties/src/trailties/action-dispatch.ts`
- `packages/trailties/src/trailties/global-id.ts`
- `packages/trailties/src/trailties/active-support.ts` (already there)

### Why this direction and not the other

An earlier attempt (PR #7386, closed unmerged) did the opposite — it moved
`Rails::Railtie` down into activesupport so every framework package could reach
it. That is the wrong trade, for three measured reasons:

1. **It puts a railties-gem class at the bottom of the dependency graph.**
   `parity:api` maps gem to package (`PATH_SEGMENT_ALIASES: { railties:
"trailties" }`, `scripts/parity/conventions.ts`), so `railtie.rb` is expected
   at `packages/trailties/src/trailtie.ts` — where Rails has it. Moving it costs
   **58 methods** off trailties' score (`railtie.rb` 25, `initializable.rb` 16,
   `railtie/configuration.rb` 14, `railtie/configurable.rb` 3), measured: main
   530/1612, that branch 467/1612.
2. **Moving the framework railties instead costs ~0.** Their `railtie.rb` files
   contribute no methods to their packages today — a Rails railtie body is
   class-level `initializer` blocks, not method definitions, and none of the six
   appears in the comparison at all.
3. **It matches the direction Rails itself takes.** `active_model/railtie.rb:4`
   is `require "rails"` — the framework railtie file reaches UP into railties,
   with no gemspec dependency. The cross-boundary edge in Rails runs framework →
   railties, which is exactly the edge this shape preserves.

### The constraint that forces a choice at all

`tsc --build` requires a DAG, and `trailties` already depends on `activerecord`
→ `activemodel`. So `packages/activemodel/src/trailtie.ts` cannot import
`Trailtie` from trailties without a cycle. Ruby escapes this because
`require "rails"` is a runtime, opt-in load with no static graph. The slot idiom
does not help: CLAUDE.md rules it out for `extends` edges explicitly — "nothing
then loads the subclass modules at all, so their self-registration never runs".

So a deviation is unavoidable; this is the smaller one (6 railtie files off
their Rails path, all of them consistent with each other, versus the base class
and its three helpers off theirs). Record it as a receipt where the moved files
land, not as a `parity:api` redirect table — teaching the comparer to accept a
wrong location is ratification, not convergence.

## Acceptance criteria

- [ ] One `Trailtie` class, at `packages/trailties/src/trailtie.ts`; framework
      railties and trailties' `Engine` / `Application` share it.
- [ ] `parity:api` does not regress for trailties, activemodel, activerecord,
      actionview, actionpack or globalid.
- [ ] `Application#railtiesInitializers` is the plain `application.rb:614-624`
      body again, with no `typeof r === "function"` arm and no `OrderedRailtie`
      union.
- [ ] Framework railtie initializers accept `before:` / `after:` / `group:`.
- [ ] Existing `RailtieTest` cases in each package keep their names.
