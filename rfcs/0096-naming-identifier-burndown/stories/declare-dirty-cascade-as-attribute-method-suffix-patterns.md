---
title: "declare-dirty-cascade-as-attribute-method-suffix-patterns"
status: claimed
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T11:39:43Z"
assignee: "came-from-user-suffix-pattern-is-unregistered"
blocked-by: null
closed-reason: null
---

# Declare the dirty cascade as attribute_method_suffix patterns, retiring defineDirtyAttributeMethods

## Context

Rails does not have a `define_dirty_attribute_methods`. It declares the whole
per-attribute dirty cascade as pattern declarations —
`vendor/rails/activerecord/lib/active_record/attribute_methods/dirty.rb` and
`vendor/rails/activemodel/lib/active_model/dirty.rb` carry
`attribute_method_suffix "_changed?", "_change", "_was", "_previously_changed?",
…` and `attribute_method_affix prefix: "restore_", suffix: "!"` — so
`define_attribute_methods` walks `attribute_method_patterns` and emits every one
of them through `define_attribute_method_pattern`
(`activemodel/lib/active_model/attribute_methods.rb:333-346`).

trails emits them from a single hand-written function instead:
`defineDirtyAttributeMethods` in `packages/activemodel/src/attribute-methods.ts`,
which holds a hardcoded 12-entry `binding` table mapping each generated name to
its generic handler.

PR #6761 moved that function's output into the class's
`generated_attribute_methods` module and put it on the
`define_attribute_methods` path behind
`instance_method_already_implemented?` — so the OWNER, the GUARD and the CALL
SITE are now Rails'. What is left is the last step: the function itself, and the
`binding` table inside it, which is `@noRailsEquivalent CONVERGEABLE` today.

## Converged shape

Push the 12 names into `_attributeMethodPatterns` as `attributeMethodSuffix` /
`attributeMethodAffix` declarations at the Rails declaration sites, and let
`defineAttributeMethod`'s existing `for (const pattern of
this._attributeMethodPatterns)` loop emit them. `defineDirtyAttributeMethods`
and its `binding` table then delete, and the `@noRailsEquivalent` tag on it goes
with them.

The gap that kept them out of the pattern list is the generated BODY:
`defineAttributeMethodPattern` routes a pattern through
`define_method_<proxy_target>` when the class answers one and otherwise falls
through to `defineProxyCall`, whereas the dirty methods route through
`attribute_missing({ proxyTarget, attrName }, ...)` so a subclass can intercept
the whole cascade by overriding one generic (`attribute_methods.rb:520-522`).
Rails reaches the same place via `method_missing`/`matched_attribute_method`;
confirm which of the two shapes `defineProxyCall` should emit before moving the
declarations.

Note the trails spelling of the names is camel, not the Ruby suffixes:
`nameChanged`, `savedChangeToName`, `willSaveChangeToName`, `restoreName` — see
docs/ruby-ts-conventions.md. `AttributeMethodPattern#methodName` has to produce
those, which is part of this story.

## Acceptance criteria

- [ ] The dirty cascade is declared with `attributeMethodSuffix` /
      `attributeMethodAffix` at the Rails declaration sites (`dirty.rb`),
      not by a hand-written table.
- [ ] `defineDirtyAttributeMethods` is deleted from
      `packages/activemodel/src/attribute-methods.ts` and from the package
      index; its `@noRailsEquivalent` tag goes with it and
      `parity:api:extra --package activemodel` novel count drops.
- [ ] The generated names are unchanged (`nameChanged`, `nameWas`,
      `savedChangeToName`, `restoreName`, …) and every dirty test passes with
      no rename.
- [ ] `undefineAttributeMethods` still clears the cascade, and a class-body
      method still outranks it (the two tests added in #6761 stay green).
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
