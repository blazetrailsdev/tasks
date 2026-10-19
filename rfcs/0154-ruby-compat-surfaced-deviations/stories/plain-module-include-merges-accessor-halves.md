---
title: "Plain-object include merges a reader-only module with an existing writer"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

`rbModAppendFeatures`' plain-object arm (`packages/ruby-compat/src/include.ts`, the `else` branch after the class-module loop) copies each enumerable descriptor whole. A plain-object module that defines only a reader (`get queueName()`) therefore overwrites the writer half an earlier include installed (`Core`'s `attr_accessor :queue_name` setter, `activejob/lib/active_job/core.rb`), and `new Base()` throws "Cannot set property queueName … which has only a getter". In Ruby `queue_name` and `queue_name=` are separate method entries (`vendor/ruby/v3.3.11/class.c:1253` `include_modules_at`), so including a reader-only module never touches the writer. The class-module arm already merges the halves (`higher.get ?? lower.get`). trails#9067 worked around this by making `QueueName` / `QueuePriority` class modules.

## Acceptance criteria

- [ ] The plain-object arm merges accessor halves the same way the class-module arm does.
- [ ] A test in `include.test.ts`: a plain module with a getter only, included after one with a setter only, leaves both halves working.
- [ ] `QueueName` / `QueuePriority` can go back to being plain-object modules (optional follow-up in the same PR).
