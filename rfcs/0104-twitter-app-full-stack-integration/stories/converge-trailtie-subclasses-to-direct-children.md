---
title: "converge-trailtie-subclasses-to-direct-children"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
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

`Trailtie.subclasses()` (`packages/trailties/src/trailtie.ts:34-42`) returns
every non-abstract class in the explicit `_registry`, TRANSITIVELY. Ruby's
`Railtie.subclasses` is `super.reject(&:abstract_railtie?).sort`
(`vendor/rails/railties/lib/rails/railtie.rb:148-150`) over Ruby's
`Class#subclasses`, which is DIRECT children only.

That difference is load-bearing, not cosmetic. `Railties#initialize` is
`::Rails::Railtie.subclasses + ::Rails::Engine.subclasses`
(`vendor/rails/railties/lib/rails/engine/railties.rb:9-12`), and it is the
direct-children semantics that keeps an `Application` subclass out of the
collection — which `Application#ordered_railties` then relies on when it does
`all.push(self) unless (all + order).include?(self)`
(`application.rb:601-602`). With the transitive set, `railties_initializers`
recursed into every other `Application` subclass in the registry and blew the
stack; #7349 discovered this and worked around it INSIDE `Trailties`:

```ts
// packages/trailties/src/engine/trailties.ts
readonly all: Trailtie[] = [
  ...Trailtie.subclasses().filter((k) => Object.getPrototypeOf(k) === Trailtie),
  ...Trailtie.subclasses().filter((k) => Object.getPrototypeOf(k) === Engine),
].map((k) => k.instance());
```

Those two `Object.getPrototypeOf` filters are a shape Rails does not have.
They belong in `subclasses()`, which is the method whose contract is wrong.

## Converged shape

Make `Trailtie.subclasses()` direct-children-of-`this`, matching
`Class#subclasses`:

```ts
static subclasses(): Array<typeof Trailtie> {
  return [...Trailtie._registry]
    .filter((s) => Object.getPrototypeOf(s) === this && !s.isAbstractRailtie())
    .sort(byLoadIndex);
}
```

Then `Trailties#all` becomes the literal
`Trailtie.subclasses() + Engine.subclasses()` and the two filters delete.

The one blocker to check first: `Engine.engineSubclasses()`
(`packages/trailties/src/engine.ts:60-62`) is a trails invention that wants
every Engine DESCENDANT for `Engine.find`, and today gets it from the
transitive `Trailtie.subclasses()`. It needs its own registry walk, or a
`descendants` analogue — Rails' `Engine.find` iterates
`::Rails::Engine.subclasses` too (`engine.rb:404`), so check whether the
transitive reach was ever right.

## Acceptance criteria

- `Trailtie.subclasses()` returns direct children of the receiver.
- `Trailties#all` is the plain two-set concatenation with no filters.
- `Engine.engineSubclasses` still resolves a nested engine, or converges onto
  `Engine.subclasses` as `engine.rb:404` has it.
