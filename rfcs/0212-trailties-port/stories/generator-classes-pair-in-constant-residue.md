---
title: "generator-classes-pair-in-constant-residue"
status: draft
updated: 2026-11-03
rfc: "0212-trailties-port"
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

`scripts/api-compare/class-paths.ts`'s `constantResidue` marks a walked export `excluded` when no `rails-api.json` pairing entry names it (`excluded = walked keys not in entries`, `class-paths.ts:549`). Every trailties generator class is in `scripts/api-compare/constant-residue.json`'s `trailties.excluded`: `generators/trails/model/model-generator.ts::ModelGenerator`, `generators/trails/resource/resource-generator.ts::ResourceGenerator`, `generators/active-record/model/model-generator.ts::ModelGenerator` and the rest. Each has a Ruby counterpart (`Rails::Generators::ModelGenerator`, `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/model/model_generator.rb`; `ActiveRecord::Generators::ModelGenerator`, `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/model_generator.rb`). The pairing misses them, probably because of the `rails/` to `trails/` path segment and the activerecord gem's `lib/rails/generators` tree. trails#9664 added the two `ApplicationRecordGenerator` classes and had to receipt them `CONVERGEABLE` against this story.

## Acceptance criteria

- Generator classes pair with their Ruby constants in the class-path walk, and `constant-residue.json`'s `trailties.excluded` drops them.
- The `@noRailsEquivalent CONVERGEABLE` receipts on both `application-record-generator.ts` files are removed.
