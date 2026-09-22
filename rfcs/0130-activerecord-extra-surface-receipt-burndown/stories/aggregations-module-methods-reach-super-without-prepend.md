---
title: "Aggregations module carries its super-calling methods instead of prepending from [included]"
status: done
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: trails#7963
claim: "2026-09-22T15:11:48Z"
assignee: "aggregations-module-methods-reach-super-without-prepend"
blocked-by: null
closed-reason: null
---

## Context

trails#7951 ported `composed_of`'s `unless self < Aggregations; include Aggregations; end`
(`vendor/rails/activerecord/lib/active_record/aggregations.rb:228-230`) as
`if (!isModuleIncluded(modelClass, Aggregations)) include(modelClass, Aggregations)`.
But `Aggregations` (`packages/activerecord/src/aggregations.ts`) is a plain object whose only
member is an `[included]` hook, and that hook calls `prepend(base.prototype, { initializeDup, reload, initInternals })`.
Rails' module (`aggregations.rb:5-24`) carries those three methods itself, and each one calls `super`.
The workaround exists because neither a plain-object module nor a ruby-compat `Module` carrier
(`packages/ruby-compat/src/include.ts`, `appendFeatures` splices a per-includer link) gives its
methods a way to reach `super`.

## Acceptance criteria

- `Aggregations` carries `initializeDup`, `reload` and `initInternals` as its own members, and they reach
  the next ancestor the way Ruby `super` does, through ruby-compat `Module` / `include`, with no `prepend` from `[included]`.
- If ruby-compat needs a super mechanism for `Module` carriers, add it there, mirroring `vendor/ruby` method lookup.
- The aggregations suites stay green, and no call, args or extra rows are added.
