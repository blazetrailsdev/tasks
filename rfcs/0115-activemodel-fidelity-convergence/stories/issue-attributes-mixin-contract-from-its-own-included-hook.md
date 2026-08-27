---
title: "issue-attributes-mixin-contract-from-its-own-included-hook"
status: done
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7124
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Prerequisite slice carved out of
`move-attributes-and-attribute-methods-off-active-model-model`, whose own
"What the Dirty slice learned" section names it: "the module's `[included]` hook
is where the `extend(base, ...ClassMethods)` calls belong, the way
ActiveSupport::Concern's `append_features` does it. Neither `AttributeRegistration`
nor `Attributes` currently exports a `ClassMethods` object; `model.ts` builds one
inline. Adding `AttributeRegistration::ClassMethods`
(`attribute_registration.rb:11`) and `Attributes::ClassMethods` (`attributes.rb:38`)
is a fidelity win in itself."

`ActiveModel::Attributes` is `include AttributeRegistration` +
`include AttributeMethods` (`attributes.rb:32-33`) plus its own `ClassMethods`
(:38-104) and `included do` (:35). `packages/activemodel/src/model.ts` spelled all
four out as six statements at the bottom of the file, with
`Attributes::ClassMethods` as an inline object literal
(`const AttributesClassMethods = { attribute, setDefineMethodAttribute, attributeNames }`),
so a second host could not get the stack from one `include(X, Attributes)`.

This story is only the wiring — it does NOT remove the stack from
`ActiveModel::Model`, wire `ActiveRecord::Base` at `base.rb:311` / `:316`, or
re-declare the class half across the ~52 activemodel test models. That remains
`move-attributes-and-attribute-methods-off-active-model-model`, which this
unblocks.

## Acceptance criteria

- `AttributeRegistration::ClassMethods` (attribute_registration.rb:11-115,
  including the `private` half at :53) and `Attributes::ClassMethods`
  (attributes.rb:38-104) exist as exported module objects at their Rails file,
  not as an inline literal in `model.ts`.
- `Attributes.[included]` issues the whole contract in `append_features` order
  (`activesupport/lib/active_support/concern.rb:135-138`): dependencies, then the
  module's own instance half (`super`), then its `ClassMethods`, then the
  `included do` block.
- `model.ts`'s attribute wiring is the single `include(Model, Attributes)` that
  `model.rb` writes.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; `pnpm parity:api:extra --package activemodel` shows no new novel rows.
