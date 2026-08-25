---
title: "define_method_attribute= and define_method_attribute collide on one TS name"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6717
claim: "2026-08-18T19:47:46Z"
assignee: "port-date-sub-today-now-receiver-class"
blocked-by: null
closed-reason: null
---

## Context

Three trails functions are all spelled `defineMethodAttribute`, but Rails has
only two `define_method_#{proxy_target}` hooks and they are different methods:

- `vendor/rails/activemodel/lib/active_model/attributes.rb:92` —
  `define_method_attribute=(canonical_name, owner:, as:)`, the **writer** hook
  for the `attribute=` pattern. Ported as
  `packages/activemodel/src/attributes.ts:233` `defineMethodAttribute`.
- `vendor/rails/activerecord/lib/active_record/attribute_methods/read.rb:11` —
  `define_method_attribute(canonical_name, owner:, as:)`, the **reader** hook
  for the bare pattern. Ported as
  `packages/activerecord/src/attribute-methods/read.ts:53` (module-private).
- `packages/activerecord/src/attribute-methods/write.ts:46` carries a third,
  also `defineMethodAttribute`.

So the reader and the writer collide on one TS name, and none of the three is
wired to a class, which means
`defineAttributeMethodPattern`'s `respond_to?("define_method_#{proxy_target}")`
fork (`activemodel/attribute-methods.ts`, mirroring
`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:333-346`) can
never find one. All three bodies compute a method name through
`AttrNames.defineAttributeAccessorMethod` and discard it.

Surfaced while scoping `bare-attribute-method-pattern-generates-reader`
(RFC 0096): that story cannot land until it is decided which TS name the fork
should reach, because Ruby `foo=` has no TS spelling and the two hooks now
share one.

## Converged shape

Pick the settled trails spelling for a Ruby `x=` class method (the `setX()`
idiom `docs/ruby-ts-conventions.md` names for instance writers is the obvious
candidate — `setDefineMethodAttribute` reads badly, so this needs a decision,
not a default), apply it to the ActiveModel writer hook, and leave
`defineMethodAttribute` to mean the reader hook it means in Rails. Then wire
each to its class so the `define_method_#{proxy_target}` fork dispatches as it
does at attribute_methods.rb:333-346.

Blocks `bare-attribute-method-pattern-generates-reader`.

## Acceptance criteria

- [ ] `define_method_attribute=` and `define_method_attribute` have distinct TS
      names, each traceable through `docs/ruby-ts-conventions.md`.
- [ ] Each is reachable from `defineAttributeMethodPattern`'s
      `define_method_#{proxy_target}` fork rather than being dead code.
