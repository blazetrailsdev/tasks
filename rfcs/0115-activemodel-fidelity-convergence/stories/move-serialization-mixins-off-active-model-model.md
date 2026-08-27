---
title: "move-serialization-mixins-off-active-model-model"
status: done
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7105
claim: "2026-08-26T21:48:02Z"
assignee: "move-serialization-mixins-off-active-model-model"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Model` is `include ActiveModel::API` + `include ActiveModel::Access`
and nothing else (`vendor/rails/activemodel/lib/active_model/model.rb:42-45`);
`API` contributes `AttributeAssignment`, `Validations` and `Conversion`
(`api.rb:60-65`). Serialization is NOT in that chain — Rails' own
`serializers/json_test.rb` models spell `include ActiveModel::Serializers::JSON`
themselves.

trails' `Model` mixes it in for everyone:

- `packages/activemodel/src/model.ts:728-729` — `include(Model, Serialization)`
  and `include(Model, SerializersJSON)`.
- the matching type-only `declare` / `interface Model` members in the same file.

`pnpm parity:api:extra --package activemodel` therefore scores `model.ts` at
0 novel / **61 moved**, of which this mixin pair owns `asJson`, `fromJson`,
`includeRootInJson`, `serializableHash`, `toJson` and friends.

This is the first slice of the parent story
`split-model-mixin-surface-to-active-model-model`, which was too large to land
as one PR (55 activemodel test files extend `Model`, plus `ActiveRecord::Base`).

## Acceptance criteria

- `Serialization` and `Serializers::JSON` are no longer mixed into
  `ActiveModel::Model`; `ActiveRecord::Base` includes them where `base.rb` does.
- Every activemodel test model that relies on them includes them explicitly, the
  way the Rails test file it mirrors does.
- `model.ts`'s `moved` count drops by the names those two modules own.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean; parity deltas non-negative.
