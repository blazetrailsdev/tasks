---
title: "resetColumnInformation is awaited, or synchronous as in Rails"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: tests
packages: [activerecord]
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`model-schema.ts:418` types `resetColumnInformation` as
`PromiseLike<void> | void`, and `model-schema.ts:597` voids it. About 120 of
activerecord's 298 test sites are `void X.resetColumnInformation()`. Rails'
`reset_column_information`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb`) is
synchronous.

## Acceptance criteria

- [ ] Decide from the trails body which arm returns a promise. If it can be synchronous as in Rails, make it so; otherwise every call site awaits it.
- [ ] Zero `void <...>.resetColumnInformation()` remain in sources or tests.
- [ ] activerecord's test mark drops by the converged count.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
