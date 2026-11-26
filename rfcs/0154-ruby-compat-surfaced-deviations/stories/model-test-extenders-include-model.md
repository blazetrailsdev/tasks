---
title: "model-test-extenders-include-model"
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

Rails test classes write `include ActiveModel::Model`; ~60 trails test files write `class X extends Model` instead (`grep -rln "extends Model\b" packages/*/test`). `Model` is to become a Concern object (`model-is-an-includable-concern`), which a class cannot extend.

## Acceptance criteria

- Every test class mirroring `include ActiveModel::Model` takes it by `include(this, Model)` in a static block, with `API#initialize` (`vendor/rails/v8.0.5.2/activemodel/lib/active_model/api.rb:80-84`) inlined in its constructor where the class has none of its own.
- Split by package if over the LOC ceiling.
