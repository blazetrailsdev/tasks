---
title: "Remove generateMethodMissing's prototypeLayer option"
status: in-progress
updated: 2026-11-02
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9636
claim: "2026-11-02T18:21:42Z"
assignee: "zeitwerk-check-name-error-reaches-task-abort"
blocked-by: null
closed-reason: null
---

## Context

`Delegation.generateMethodMissing`'s `has` trap (`packages/activesupport/src/delegation.ts`) takes an invented `prototypeLayer` option, because a `has` trap gets no receiver. Rails' `delegate_missing_to` answers `respond_to_missing?` on the instance (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/delegation.rb`). `Attachment` and `Many` pass the option, so `in` on them never sees the target.

## Acceptance criteria

- The `prototypeLayer` option is removed, or `in` answers the delegated name on an instance as `respond_to?` does.
