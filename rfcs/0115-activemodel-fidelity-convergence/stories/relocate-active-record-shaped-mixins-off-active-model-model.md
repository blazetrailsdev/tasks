---
title: "relocate-active-record-shaped-mixins-off-active-model-model"
status: closed
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps:
  [
    move-serialization-mixins-off-active-model-model,
    move-attribute-mixins-off-active-model-model,
    trim-active-model-model-to-api-and-access,
  ]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Umbrella fully decomposed and all slices landed. Its own blocked-by note said 'close it when the slices land'; the last outstanding slice trim-active-model-model-to-api-and-access is done (PR #7160), joining move-serialization-mixins-off-active-model-model (#7105), move-attribute-mixins-off-active-model-model (#7113), move-attributes-and-attribute-methods-off-active-model-model (#7134) and group-model-ts-remaining-inline-mixin-literals-into-module-objects (#7127). Evidence on origin/main: packages/activemodel/src/model.ts is now 182 lines and its only mixin wiring is include(Model, API) :171, include(Model, ToJsonWithActiveSupportEncoder) :173, include(Model, Access) :175 — the extend(Model, ValidationsCallbacksClassMethods) seat the prior note recorded at :191 is gone, as is the whole ActiveRecord-shaped attribute stack (:546/:561/:564/:569-573). Nothing left for this umbrella to carry; per its own instruction it was never to be scheduled as its own PR."
---

## Context

`ActiveModel::Model` is two `include`s
(`vendor/rails/activemodel/lib/active_model/model.rb:42-45`):

```ruby
module Model
  extend ActiveSupport::Concern
  include ActiveModel::API
  include ActiveModel::Access
end
```

and `ActiveModel::API` adds `AttributeAssignment`, `Validations` and
`Conversion`, plus `extend Naming` / `extend Translation` from its `included`
block, `initialize` and `persisted?` (api.rb:59-98).

trails' `Model` ALSO mixes in Attributes, AttributeRegistration,
AttributeMethods, Dirty, Serialization, Serializers::JSON,
ForbiddenAttributesProtection and Validations::Callbacks — the surface
`ActiveRecord::Base` composes in Rails, hoisted onto `ActiveModel::Model`.
`pnpm parity:api:extra --package activemodel` scores that as `model.ts`'s
`moved` count.

`split-model-mixin-surface-to-active-model-model` (PR #TBD) established the
measurement half: the extra-surface allow-set now follows the
`ActiveSupport::Concern` hook (`ClassMethods` + the `included do extend X end`
block) and the `ActiveModel::Callbacks.extended` body, so `model.ts` fell from
61 `moved` to 45 without a line of `packages/**` changing. Those 45 are the
real deviation, and they are exactly the mixin set above:

- Attributes / AttributeRegistration — `attribute`, `attributeNames`,
  `attributeTypes`, `typeForAttribute`, `decorateAttributes`,
  `setDefineMethodAttribute`
- AttributeMethods — `aliasAttribute`, `attributeMethod{Prefix,Suffix,Affix}`,
  `attributeMethodPatterns*`, `define{,Undefine}AttributeMethod{,s,Pattern}`,
  `generatedAttributeMethods`, `isInstanceMethodAlreadyImplemented`,
  `matchedAttributeMethod`, `missingAttribute`, `attributeMissing`,
  `respondTo`, `isRespondToWithoutAttributes`, `attributeAliases`,
  `isAttributeAliases`, `isAttributeMethodPatterns`,
  `eagerlyGenerateAliasAttributeMethods`
- Dirty — `attributeChanged`, `attributeChangedInPlace`, `attributeWas`,
  `attributePreviouslyChanged`, `attributePreviouslyWas`, `changesApplied`,
  `clearAttributeChanges`, `clearChangesInformation`, `restoreAttributes`
- Serialization / Serializers::JSON — `serializableHash`,
  `readAttributeForSerialization`, `asJson`, `fromJson`, `toJSON`,
  `includeRootInJson`
- Validations::Callbacks — `beforeValidation`, `afterValidation`

The relocation is what is left, and it is large: ~55 files under
`packages/activemodel/src/**` declare `class X extends Model` and read those
members off the inherited surface, where Rails' own activemodel tests write
`include ActiveModel::Model` + `include ActiveModel::Attributes` per test class
(`vendor/rails/activemodel/test/cases/`). Each such class needs its own
`include(X, Attributes)` call plus the `interface X extends …` merge that types
it, which is why this cannot ride along with the measurement fix.

Mixin relocation targets, per Rails:
`ActiveRecord::Base` includes AttributeMethods, Dirty (via
`AttributeMethods::Dirty`), Serialization and `Serializers::JSON`
(`vendor/rails/activerecord/lib/active_record/base.rb:290-330`), and
`ActiveRecord::Validations` includes `ActiveModel::Validations::Callbacks`
(`activerecord/lib/active_record/validations.rb`). Attributes /
AttributeRegistration are `ActiveModel::Attributes`, included per model.

## Acceptance criteria

- Each mixin trails' `Model` includes that `ActiveModel::Model` does not either
  moves to the Rails host that includes it, or is ratified once, centrally,
  with the reason and the Rails `file:line`.
- `pnpm parity:api:extra --package activemodel` reports `model.ts` at
  0 novel / 0 moved, and `model.ts` is <= 200 code lines.
- `model.ts` reads as the port of `model.rb` + `api.rb` + `access.rb`, and
  nothing else.
- The activemodel and activerecord suites stay green; parity deltas
  non-negative; `pnpm parity:api:calls` / `:args` clean.

This is bigger than one PR: split it per mixin (Serialization+JSON, Dirty,
AttributeMethods, Attributes+AttributeRegistration, Validations::Callbacks) and
file one story per mixin off this one rather than opening a stack.
