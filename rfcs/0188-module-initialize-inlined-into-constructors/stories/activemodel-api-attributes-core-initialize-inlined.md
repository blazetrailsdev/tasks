---
title: "activemodel-api-attributes-core-initialize-inlined"
status: draft
updated: 2026-10-19
rfc: "0188-module-initialize-inlined-into-constructors"
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

`ActiveRecord::Base`'s constructor (`packages/activerecord/src/base.ts`) now carries `@inlinedFrom ActiveModel::API#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`), but the body is not inlined there: `super(attrs)` reaches `Model`'s constructor (`packages/activemodel/src/model.ts:123`), which calls `this.initialize(attributes)`, a method assembled from `defineMethod("initialize", …)` modules (`activemodel/src/api.ts:30`, `activemodel/src/attributes.ts:72`, `activerecord/src/core.ts:841`). `api.ts`'s `initialize` also still calls `initializeIncludedModules(this)`, which no `[initialize]` hook reaches any more. The call gate's `activerecord base.ts initialize assign_attributes` row is baselined against this story.

## Acceptance criteria

- `API#initialize`, `Attributes#initialize` and `Core#initialize` are inlined into the constructors of their includers per RFC 0188, with no `defineMethod("initialize", …)` left.
- The `assign_attributes` baseline row is deleted and `initializeIncludedModules` has no caller outside ruby-compat.
