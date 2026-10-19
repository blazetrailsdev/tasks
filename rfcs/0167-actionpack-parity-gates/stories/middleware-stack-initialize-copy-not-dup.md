---
title: "middleware-stack-initialize-copy-not-dup"
status: draft
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

Rails' `ActionDispatch::MiddlewareStack#initialize_copy(other)` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb:102-104`) is `self.middlewares = other.middlewares.dup`, reached through `stack.dup`. trails ports it as an invented `dup()` method (`packages/actionpack/src/action-dispatch/middleware/stack.ts:100-104`) that builds `new this.constructor()` and copies `entries`, so `parity:api` pairs `initialize_copy` with `dup`. CLAUDE.md § "Fidelity is the job" routes Ruby `dup` through `rbObjDup` from ruby-compat, which dispatches the class's `initializeCopy`.

`pin-actionpack-method-bodies` left this one pair unpinned because the body is not a faithful port.

## Acceptance criteria

- `MiddlewareStack` answers `initializeCopy(other)` with Rails' body, callers use `rbObjDup(stack)`, and the invented `dup()` is removed.
- The `middleware/stack.rb` `initialize_copy` pair is pinned (`pnpm parity:api:pins` passes) and actiondispatch reports `0 unpinned`.
