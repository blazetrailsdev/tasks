---
title: "ThroughReflection delegators raise DelegationError on nil source_reflection"
status: in-progress
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 3
pr: trails#7963
claim: "2026-09-22T15:11:48Z"
assignee: "aggregations-module-methods-reach-super-without-prepend"
blocked-by: null
closed-reason: null
---

## Context

trails#7951 made `ThroughReflection#foreignKey` / `#foreignType` / `#type`
(`packages/activerecord/src/reflection.ts`) delegate to `this.sourceReflection!` alone, mirroring
`delegate ..., to: :source_reflection` (`vendor/rails/activerecord/lib/active_record/reflection.rb:973-974`).
When the source reflection is nil, Rails' generated delegator raises
`Module::DelegationError.nil_target(:foreign_key, :source_reflection)`
(`activesupport/lib/active_support/delegation.rb`). trails instead throws a plain `TypeError`.
`DelegationError.nilTarget` already exists in `packages/activesupport/src/delegation.ts`.

## Acceptance criteria

- A nil `sourceReflection` raises `DelegationError` with Rails' `nil_target` message from all three members.
  Prefer the activesupport `Delegation` machinery if it can generate these delegators.
- The reflection suites stay green, and no call or args rows are added.
