---
title: "ControllerRuntime#initialize is inlined into the including controller"
status: ready
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord", "actionpack"]
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

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:api` reports
`ActiveRecord::Railties::ControllerRuntime#initialize` missing from
`trailties/controller-runtime.ts` (6/7).

Rails: `def initialize(...)`, `super`, then `self.db_runtime = nil`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb:26-29`).
ControllerRuntime is a concern included into `ActionController::Base` from a
load hook. trails' class module
(`packages/activerecord/src/trailties/controller-runtime.ts:79-91`) has no
constructor segment, and no including constructor carries
`@inlinedFrom ActiveRecord::Railties::ControllerRuntime#initialize`.

## Acceptance criteria

- [ ] The body is inlined at Ruby's `super` position in the including
      controller's constructor, behind `isModuleIncluded(new.target, ControllerRuntime)`
      with `@inventedArm if — PERMANENT` and the `@inlinedFrom` tag
      (CLAUDE.md § "A module installed at run time is inlined behind a guard").
- [ ] A test shows `dbRuntime` is `null` on a fresh controller instance.
- [ ] `parity:api` shows `railties/controller_runtime.rb` at 7/7, and
      `pnpm parity:api:inlined` is green.
