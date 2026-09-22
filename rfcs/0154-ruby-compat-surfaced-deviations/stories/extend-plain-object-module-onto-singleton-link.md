---
title: "extend(obj, plainObject) writes own properties instead of a singleton link, so it shadows Module extensions"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Object#extend` (`vendor/ruby/eval.c:1778` `rb_obj_extend` → `:1713` `rb_extend_object` = `rb_include_module(rb_singleton_class(obj), module)`) always puts the module in the receiver's singleton ancestry. It never writes methods onto the object itself, so a later `extend` sits above an earlier one and `super` walks between them.

After trails#7978, ruby-compat `extend(obj, mod)` (`packages/ruby-compat/src/include.ts`, `export function extend`) sends a `Module` instance to `Module#extendObject`, which splices a link into the prototype chain. A plain-object module still takes the old copy path and defines its methods as OWN properties of the receiver. An own property always beats a prototype link, so when plain-object and `Module` extensions are mixed on one receiver, the plain object wins whatever the `extend` order. Example: `CollectionProxy` built with `extend: [someModule, plainObject]`, where Rails puts `someModule` above. This is why #7978 had to turn `Post.namedExtension2` and `CommentsWithExtendAssociationExtension` into `Module`s. `Relation#extending!` / `initializeCopy` and every `CollectionProxy` with a plain-object `extend:` option (`Post.comments`, `Author.namedExtension`, the HABTM `DeveloperWithExtendOption`) go through the plain path.

## Converged shape

For a non-class receiver, `extend(obj, plainObject)` splices a singleton link the way `Module#extendObject` does (same dedup and relink behaviour), instead of `defineProperty` on `obj`. The class-receiver (static `extend`) path keeps its current precedence rules.

## Acceptance criteria

- `extend(obj, A); extend(obj, B)` for plain objects `A` and `B` puts `B` above `A` through prototype links, and mixing plain and `Module` extensions follows extend order.
- The `CollectionProxy` / `Relation#extending` tests stay green. Add a ruby-compat test that mixes a plain-object module with a `Module`.
