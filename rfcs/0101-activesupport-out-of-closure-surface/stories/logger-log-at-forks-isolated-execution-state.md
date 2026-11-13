---
title: "logger-log-at-forks-isolated-execution-state"
status: draft
updated: 2026-11-13
rfc: "0101-activesupport-out-of-closure-surface"
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

`LoggerThreadSafeLevel#log_at` (`vendor/rails/v8.0.2/activesupport/lib/active_support/logger_thread_safe_level.rb:35-41`) sets `local_level` and restores it in `ensure`, keyed on `IsolatedExecutionState`. The trails port (`packages/activesupport/lib/logger-thread-safe-level.ts`, `logAt`) adds an invented arm. When the block returns a thenable, it defers the restore to `.finally`. That shares one thread-local slot between sibling in-flight promises, so two concurrent `logAt` blocks can interleave and restore each other's level. The arm carries no receipt.

Root CLAUDE.md § "A thread-local block stack forks per async block (`IsolatedExecutionState.fork`)" already settles this shape. The block's entry opens a child context with `IsolatedExecutionState.fork(key, block)`, and the one opening call carries `@inventedArm fork — PERMANENT`.

## Acceptance criteria

- `logAt` runs its block under `IsolatedExecutionState.fork` for its local-level key, mirroring `log_at`'s set / `yield` / `ensure` restore line for line, with no thenable-sniffing arm.
- A trails test shows two concurrent async `logAt` blocks at different levels, each seeing its own level.
