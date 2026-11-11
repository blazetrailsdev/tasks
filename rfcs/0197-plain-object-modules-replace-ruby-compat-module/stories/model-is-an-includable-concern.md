---
title: "model-is-an-includable-concern"
status: draft
updated: 2026-11-11
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Model` is `module Model; extend ActiveSupport::Concern; include ActiveModel::API; include ActiveModel::Access; end` (`vendor/rails/v8.0.2/activemodel/lib/active_model/model.rb`). An includer gets `API` and `Access` through `Concern#append_features`, which appends a concern's `@_dependencies` (`vendor/rails/v8.0.2/activesupport/lib/active_support/concern.rb:132-142`).

In trails, `Model` (`packages/activemodel/lib/model.ts`) is a JS class: `ActiveRecord::Base` writes `extends Model`, and `Model.prototype` carries `API` / `Access` installed by `include(Model, API)` and `include(Model, Access)` at the bottom of the file. `extend(Model, Concern)` would turn those includes into recorded dependencies and leave `Model.prototype` without them. So the includer half is a hand-written `static [included](base) { include(base, API); include(base, Access); }` (trails#9967, for `SolidQueue::Configuration`'s `include ActiveModel::Model`). It has no Rails counterpart and carries `@noRailsEquivalent CONVERGEABLE model-is-an-includable-concern`.

## Acceptance criteria

- `ActiveModel::Model` is a Concern module (a plain object or a `classModule` class) that `extend`s `Concern` and records `API` and `Access` as dependencies, as `model.rb` does.
- Every class that takes Model, `ActiveRecord::Base` and `SolidQueue::Configuration` included, takes it by `include()`, or the `extends Model` edge is cited against a ratified rule.
- The `static [included]` hook on `Model` and its receipt are deleted.
- `pnpm parity:api:extra --package activemodel` novel count returns to 0 without a receipt.
