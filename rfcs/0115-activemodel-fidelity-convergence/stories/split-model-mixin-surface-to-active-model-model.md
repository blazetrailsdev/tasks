---
title: "split-model-mixin-surface-to-active-model-model"
status: in-progress
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: 7099
claim: "2026-08-26T19:29:07Z"
assignee: "split-model-mixin-surface-to-active-model-model"
blocked-by: null
closed-reason: null
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

and `ActiveModel::API` contributes `initialize` and `persisted?` (api.rb:82,
:94). trails' `Model` also mixes in Attributes, AttributeRegistration,
AttributeMethods, Dirty, Callbacks, Serialization and Serializers::JSON — the
surface `ActiveRecord::Base` composes in Rails, hoisted onto `ActiveModel::Model`.

`fan-out-model-serialization-conversion-access-naming-surface` (PR #7010) moved
every relocatable member body out of `model.ts`; what is left is the constructor,
`dup`, `isPersisted`, `isAttributeMethod`, 156 lines of type-only `declare` /
`interface Model` members, and the `include()` / `extend()` / `prepend()` calls.

`extra-surface` scores a NAME against the allow-set `model.rb` + its Ruby
include chain builds, and `model.ts` scored 61 `moved` against it. That number
was two populations, not one, and this story is the half that separates them:

1. **The allow-set was not following `ActiveSupport::Concern`.** `include M`
   where `M extend ActiveSupport::Concern` also runs `base.extend M::ClassMethods`
   and the `included` block (activesupport/lib/active_support/concern.rb:139-143).
   The static Ruby extractor files `M::ClassMethods` as a separate entity and
   flattens `included do extend X end` into `M`'s `extends`, so neither reached
   the host — `validates`, `validators`, `modelName`, `i18nScope`,
   `humanAttributeName` and friends scored `moved` on a class whose Ruby
   counterpart genuinely answers them. `ActiveModel::Callbacks.extended(base)`
   (activemodel/lib/active_model/callbacks.rb:66-70) is the same blind spot one
   level in, and it is what gives `Model` `run_callbacks` / `set_callback`.
2. **The rest is the real deviation** — the ActiveRecord-shaped mixin set —
   and it is tracked by
   `relocate-active-record-shaped-mixins-off-active-model-model`, which carries
   the full per-mixin inventory and the relocation targets. It is large: ~55
   files under `packages/activemodel/src/**` declare `class X extends Model` and
   read those members off the inherited surface, where Rails' activemodel tests
   compose the mixins per test class.

## Acceptance criteria

- The extra-surface allow-set follows Ruby's `ActiveSupport::Concern` hook —
  `M::ClassMethods` and the `included do extend X end` block reach the includer
  — and the `self.extended` body of `ActiveModel::Callbacks`.
- `model.ts`'s `moved` count falls to exactly the ActiveRecord-shaped mixin set,
  with no `packages/**` change: the residue is the relocation, not a
  measurement artifact.
- The residue is filed as its own story with the per-mixin inventory and the
  Rails host each mixin belongs to.
- `pnpm parity:api:extra:gate` stays green (the marks narrow, never widen), and
  parity deltas are non-negative.

## Definition of done

Every `moved` name left on `model.ts` is one trails' `Model` really mixes in and
`ActiveModel::Model` really does not, and the work to relocate them is scheduled.
