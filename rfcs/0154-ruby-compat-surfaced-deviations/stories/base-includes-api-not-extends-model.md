---
title: "base-includes-api-not-extends-model"
status: draft
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
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

`ActiveRecord::Base` includes `ActiveModel::API` directly (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/base.rb:283`), never `ActiveModel::Model`. trails' `Base` writes `class Base extends Model` (`packages/activerecord/lib/base.ts:363`), inheriting `Model`'s constructor and its ~40 validation/callback static declarations (`packages/activemodel/lib/model.ts`). This edge blocks turning `Model` into a Concern (`model-is-an-includable-concern`).

## Acceptance criteria

- `Base` does not extend `Model`; it takes `API` (and the other modules base.rb lists) by `include()`.
- `Base`'s constructor holds the `API#initialize` segment it already cites via `@inlinedFrom`, with no inherited `Model` constructor.
- The static declarations `Base` relied on from `Model` are declared on `Base` or reached through `Extended<>`.
