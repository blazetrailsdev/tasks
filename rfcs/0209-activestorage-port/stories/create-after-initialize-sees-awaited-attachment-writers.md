---
title: "create-after-initialize-sees-awaited-attachment-writers"
status: draft
updated: 2026-10-31
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

`awaitingAssignment` (`packages/activemodel/src/attribute-assignment.ts`, trails#9530) lets a create path await an async writer such as `setAvatar`. A JS constructor cannot await, so when a hash holds an attachment key, the keys after it and the create block run after the constructor has returned, past `_runInitializeCallbacks` (`packages/activerecord/src/base.ts`). Rails runs `assign_attributes` in full, then the block, then `after_initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`, `persistence.rb:33-58`).

## Acceptance criteria

- An `after_initialize` callback on a record built by `create({ avatar: file, name })` sees `name` and the attachment change, or the limit is ruled PERMANENT by the repo owner.
- `awaitingAssignment`'s receipt is removed or made PERMANENT accordingly.
