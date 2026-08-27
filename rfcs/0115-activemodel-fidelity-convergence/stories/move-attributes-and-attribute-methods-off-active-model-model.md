---
title: "move-attributes-and-attribute-methods-off-active-model-model"
status: done
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7134
claim: "2026-08-27T18:08:24Z"
assignee: "move-attributes-and-attribute-methods-off-active-model-model"
blocked-by: null
closed-reason: null
---

## Context

Third slice of `split-model-mixin-surface-to-active-model-model`, and the
remainder of `move-attribute-mixins-off-active-model-model` (PR that shipped the
`ActiveModel::Dirty` half). `ActiveModel::Model` is `include API` +
`include Access` (`model.rb:42-45`), and `API` is `AttributeAssignment` +
`Validations` + `Conversion` (`api.rb:60-65`) — the attribute stack is in
neither chain. Rails' `attributes_test.rb` model spells
`include ActiveModel::Model; include ActiveModel::Attributes` itself.

Still mixed into `Model` in `packages/activemodel/src/model.ts`:

- the `extend(Model, { decorateAttributes, attributeTypes, typeForAttribute,
_defaultAttributes, pendingAttributeModifications, resetDefaultAttributesBang,
resolveTypeName, hookAttributeType })` block — `ActiveModel::AttributeRegistration`
- `extend(Model, AttributeMethods.ClassMethods)` +
  `include(Model, AttributeMethods.InstanceMethods)`
- `extend(Model, AttributesClassMethods)`, `extend(Model, { defineMethodAttribute })`,
  `include(Model, Attributes)`, `include(Model, { _writeAttribute, "attribute=": _writeAttribute })`

These own most of what is left of `model.ts`'s `moved` names: `attribute`,
`attributeNames`, `attributeTypes`, `attributeAliases`, `aliasAttribute`, and
the `attributeMethod*` / `defineAttributeMethod*` family.

### What the Dirty slice learned, so this one does not re-derive it

- **Concern chaining.** `ActiveModel::Attributes` itself
  `include`s AttributeRegistration and AttributeMethods (`attributes.rb:31-32`),
  so one `include(X, Attributes)` should give a test model the whole stack — the
  module's `[included]` hook is where the `extend(base, ...ClassMethods)` calls
  belong, the way ActiveSupport::Concern's `append_features` does it. Neither
  `AttributeRegistration` nor `Attributes` currently exports a `ClassMethods`
  object; `model.ts` builds one inline. Adding
  `AttributeRegistration::ClassMethods` (`attribute_registration.rb:11`) and
  `Attributes::ClassMethods` (`attributes.rb:38`) is a fidelity win in itself.
- **ActiveRecord does NOT include `ActiveModel::Attributes`.**
  `ActiveRecord::Attributes` includes only `ActiveModel::AttributeRegistration`
  (`activerecord/attributes.rb:8`, from `base.rb:311`), and
  `ActiveRecord::AttributeMethods` includes `ActiveModel::AttributeMethods`
  (`activerecord/attribute_methods.rb:9`, from `base.rb:316`). So `Base` picks up
  two of the three modules, and needs its own wiring for the members it is
  currently inheriting from `Model`'s `Attributes` include — the `attributes`
  getter and `attributeNames` (AR has its own at
  `packages/activerecord/src/attribute-methods.ts:137` and `:...`, neither wired
  into `base.ts` today), the private `attribute(attrName)` reader, and
  `_writeAttribute` / `attribute=`.
- **The constructor is the hard part.** `Model`'s constructor inlines
  `ActiveModel::Attributes#initialize` (`attributes.rb:106-109`) —
  `this._attributes = ctor._defaultAttributes().deepDup()` — plus
  `_resurrectAttributeMethods`. TS constructors cannot be chained by `include()`
  the way Ruby's `super` chains `initialize`, and `Base` cannot set
  `this._attributes` before its own `super(attrs)` call. `packages/activemodel/
src/attributes.ts:236-240` already has the in-repo precedent for the
  workaround (`ctor._defaultAttributes ? ... : new AttributeSet()`): the presence
  of the class half the module installs IS the dispatch Ruby gets from method
  lookup. Decide and justify that at the call site.
- **The type side is what makes this big.** ~52 activemodel test files define
  `class X extends Model` and use the stack. The instance half rides on an
  `interface X extends Attributes {}` merge (the shape the Dirty slice and
  PR #7105 both used), but the CLASS half has no such merge in TS — a test model
  would need a `declare static` per class method. Find a shape for that before
  starting; a per-model 25-line static block is not it. Splitting the work
  per-module (AttributeRegistration, then AttributeMethods, then Attributes) is
  likely the only way to stay under the LOC ceiling.

## Acceptance criteria

- `Attributes`, `AttributeRegistration` and `AttributeMethods` are no longer
  mixed into `ActiveModel::Model`; `ActiveRecord::Base` includes them where
  `base.rb:311` / `:316` do, via the AR modules that include them.
- `AttributeRegistration::ClassMethods` and `Attributes::ClassMethods` exist as
  exported module objects at their Rails file, not as an inline literal in
  `model.ts`.
- Each activemodel test model that uses them includes them explicitly, mirroring
  the Rails test file.
- `model.ts`'s `moved` count drops by the names those modules own.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; parity deltas non-negative.
