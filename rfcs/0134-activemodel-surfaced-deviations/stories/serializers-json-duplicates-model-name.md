---
title: "activemodel: Serializers::JSON carries a second copy of model_name, forcing a shared namespace helper"
status: draft
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `Serializers::JSON` carries a second copy of `model_name`, forcing a shared namespace helper

## Context

`ActiveModel::Serializers::JSON` (`vendor/rails/activemodel/lib/active_model/serializers/json.rb`)
defines no `model_name`; it gets one from `ActiveModel::Naming`, whose
`model_name` (`activemodel/lib/active_model/naming.rb:271-276`) is the single
implementation in Rails.

trails has two: `naming.ts`'s `modelName` and
`packages/activemodel/src/serializers/json.ts`'s `static get modelName`
(a copy dating from PR #6572).

PR #7396 (RFC 0134, `model-name-use-relative-model-naming-detection`) taught
both halves the `use_relative_model_naming?` detection Rails does inline at
naming.rb:272-274. Because the logic has to land in two places and cannot
drift, it was factored into an exported
`detectRelativeModelNamingParent` in `naming.ts` carrying
`@noRailsEquivalent CONVERGEABLE <this story>` — extra surface that exists
only because of the second copy. Rails inlines the walk in `model_name`, so
deleting the copy deletes the helper too.

## Acceptance criteria

- `Serializers::JSON` stops defining its own `modelName` and picks up
  `Naming`'s, as `json.rb` does.
- `naming.ts`'s `detectRelativeModelNamingParent` is inlined back into
  `modelName`, matching naming.rb:271-276's single body, and its
  `@noRailsEquivalent` receipt is deleted.
- `serializers/json.ts`'s `moduleName` carrier and `_modelName` memo go with
  it if nothing else reads them.
- `pnpm parity:api:extra --package activemodel` novel count for `naming.ts`
  and `serializers/json.ts` does not rise; the permanence census stays at 0
  unclassified.
