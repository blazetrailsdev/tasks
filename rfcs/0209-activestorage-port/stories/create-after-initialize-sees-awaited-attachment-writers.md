---
title: "create-after-initialize-sees-awaited-attachment-writers"
status: done
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9569
claim: "2026-11-01T13:01:13Z"
assignee: "app-base-shell-readers-and-run-tasks"
blocked-by: null
closed-reason: null
---

## Context

`awaitingAssignment` (`packages/activemodel/src/attribute-assignment.ts`, trails#9530) lets a create path await an async writer such as `setAvatar`. A JS constructor cannot await, so when a hash holds an attachment key, the keys after it and the create block run after the constructor has returned, past `_runInitializeCallbacks` (`packages/activerecord/src/base.ts`). Rails runs `assign_attributes` in full, then the block, then `after_initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`, `persistence.rb:33-58`).

## Acceptance criteria

- An `after_initialize` callback on a record built by `create({ avatar: file, name })` sees `name` and the attachment change, or the limit is ruled PERMANENT by the repo owner.
- `awaitingAssignment`'s receipt is removed or made PERMANENT accordingly.
