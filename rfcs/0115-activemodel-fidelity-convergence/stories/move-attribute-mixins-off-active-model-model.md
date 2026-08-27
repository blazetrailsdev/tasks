---
title: "move-attribute-mixins-off-active-model-model"
status: in-progress
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7113
claim: "2026-08-27T02:10:04Z"
assignee: "move-attribute-mixins-off-active-model-model"
blocked-by: null
closed-reason: null
---

## Context

Second slice of `split-model-mixin-surface-to-active-model-model`. See the
serialization slice for the shared premise: `ActiveModel::Model` is
`include API` + `include Access` (`model.rb:42-45`), and `API` is
`AttributeAssignment` + `Validations` + `Conversion` (`api.rb:60-65`) — nothing
else.

trails' `model.ts` also carries the attribute stack, all of it hoisted from
`ActiveRecord::Base`:

- `packages/activemodel/src/model.ts:702` — `include(Model, AttributeMethods.InstanceMethods)`
- `:707-711` — `extend(Model, AttributesClassMethods)`, `include(Model, Attributes)`
- `:743` — `include(Model, Dirty)`

Rails' own `attributes_test.rb` model spells
`include ActiveModel::Model; include ActiveModel::Attributes` — the composition
is the test's, not `Model`'s.

These own most of `model.ts`'s 61 `moved` names: `attribute`, `attributeNames`,
`attributeTypes`, `attributeAliases`, `aliasAttribute`, the
`attributeMethod*` / `defineAttributeMethod*` family, and the whole Dirty set
(`attributeChanged`, `attributeWas`, `changesApplied`, `clearChangesInformation`,
…).

## Acceptance criteria

- `Attributes`, `AttributeRegistration`, `AttributeMethods` and `Dirty` are no
  longer mixed into `ActiveModel::Model`; `ActiveRecord::Base` includes them
  where `base.rb` does.
- Each activemodel test model that uses them includes them explicitly, mirroring
  the Rails test file.
- `model.ts`'s `moved` count drops by the names those modules own.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; parity deltas non-negative.
