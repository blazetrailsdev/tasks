---
title: "activerecord: Encryption::Contexts default_context / custom_contexts thread_mattr_accessors"
status: done
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#8312
claim: "2026-10-01T00:10:26Z"
assignee: "arel-port-bound-sql-literal-inspect-and-node-initialize-copy"
blocked-by: null
closed-reason: null
---

## Context

Six `parity:api` misses sit on two files:

- `encryption/contexts.rb` (8/14): `default_context`, `default_context=`, `custom_contexts`,
  `custom_contexts=` — `mattr_reader :default_context` and `thread_mattr_accessor :custom_contexts`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb`), counted twice because `Encryption` `include`s `Contexts`.
- `encryption.rb` (21/23): `custom_contexts` / `custom_contexts=` via `include Contexts`
  (`encryption.rb:47-48`).

trails reads/writes the contexts through its own seats in `packages/activerecord/src/encryption/contexts.ts`.
`thread_mattr_accessor` is ActiveSupport's `IsolatedExecutionState`-backed accessor; trails' analogue is
the execution-context store (memory: `Thread.new` is `withExecutionContext`).

## Acceptance criteria

- [ ] `defaultContext` (reader) and `customContexts` (thread-local accessor over `IsolatedExecutionState`) are declared with ActiveSupport's `mattrReader` / `threadMattrAccessor` in `contexts.ts`, and `with_encryption_context` / `without_encryption` use them as `contexts.rb` does.
- [ ] `encryption.rb` and `encryption/contexts.rb` score 100%.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
