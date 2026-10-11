---
title: "activerecord/activesupport: thread-local block stacks fork per async block at the root, not in Encryption::Contexts"
status: draft
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
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

`Contexts.with_encryption_context`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb:33-43`)
pushes onto the thread-local `custom_contexts` and pops in `ensure`. trails#8781
made sibling async blocks safe by running Rails' body under a stack of its own,
but it did so inside `packages/activerecord/src/encryption/contexts.ts`:

- a module-private `AsyncContext<Block>` store (`blocks()`, `openBlock()`,
  `interface Block`), separate from ruby-compat's `Thread` / `Fiber` locals;
- `[included]` re-defines the `customContexts` accessor over the descriptor
  `threadMattrAccessor` just made, so a read inside a block answers the block's
  stack;
- `withEncryptionContext` wraps Rails' body in `blocks().run(...)`, receipted
  `@inventedArm run — CONVERGEABLE` against this story.

Rails' `thread_mattr_accessor`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/attribute_accessors_per_thread.rb`)
stores through `ActiveSupport::IsolatedExecutionState`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/isolated_execution_state.rb`),
keyed on `Thread.current` or `Fiber.current`. trails' port
(`packages/activesupport/src/isolated-execution-state.ts`) keys on ruby-compat's
`Thread.current()`, and one `Thread` holds many in-flight promises, so every
thread-local stack a block pushes and pops has the same sibling problem:
`ActiveRecord::Suppressor`, `NoTouching`, `ScopeRegistry`, `ExplainRegistry`.

A thread-local read carries no signal of which sibling is reading, so some call
has to open the child context at block entry. A child `Thread` does not work as
it is: the connection pool keys leases on `IsolatedExecutionState.context`, so a
block in a new `Thread` would query on a different connection.

## Acceptance criteria

- [ ] The fork lives at the root: ruby-compat or `IsolatedExecutionState` owns the per-async-block state, and `threadMattrAccessor` reads through it with no accessor re-definition at the call site.
- [ ] `contexts.ts` has no `AsyncContext` store, no `Block`, `blocks()` or `openBlock()`, and `[included]` is the two Rails lines (`contexts.rb:13-16`).
- [ ] `withEncryptionContext`'s `@inventedArm run` receipt is gone, or the one call that opens the child context is the only addition and the repo owner has ruled on it.
- [ ] The sibling and nested tests in `contexts.trails.test.ts` stay green, and a block still queries on its opener's leased connection.
- [ ] The other thread-local block stacks named above are audited for the same sibling gap and converge through the same mechanism or are filed.
