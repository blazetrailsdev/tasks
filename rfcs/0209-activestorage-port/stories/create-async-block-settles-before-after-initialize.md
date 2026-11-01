---
title: "create-async-block-settles-before-after-initialize"
status: draft
updated: 2026-11-01
rfc: "0209-activestorage-port"
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

`packages/activerecord/src/base.ts`'s constructor calls `initBlock` and then `_runInitializeCallbacks` synchronously when no async writer is pending, so `create(attrs, asyncBlock)` runs `after_initialize` before the block settles. The deferred arm (trails#9569) awaits the block first. Rails yields, then runs the callbacks (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`).

## Acceptance criteria

- An `after_initialize` callback on `create(attrs, asyncBlock)` sees the block's completed writes, with or without a pending async writer.
