---
title: "Sibling async with_encryption_context blocks share one custom_contexts stack and pop out of order"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Contexts.with_encryption_context` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb:33-43`)
pushes a context onto the thread-local `custom_contexts` stack, yields, and pops in `ensure`. A Ruby
thread runs one block at a time, so the stack is strictly LIFO and `context` (`contexts.rb:61-63`) is
always the innermost open block's.

trails' port (`packages/activerecord/src/encryption/contexts.ts`, `withEncryptionContext`) keeps the
stack per execution context (`threadMattrAccessor`, trails#8312) and, for an async block, defers the
pop to the promise's settle. Two async blocks opened in the SAME execution context are siblings on
one stack:

```ts
await Promise.all([
  Encryption.withoutEncryption(async () => {
    await a(); /* reads Encryption.context */
  }),
  Encryption.withEncryptionContext({ encryptor }, async () => {
    await b();
  }),
]);
```

- after the second push, the first block's continuation reads the SECOND block's context;
- the pops run in settle order, so the first block to settle pops whichever context is on top, not
  its own.

`decryptAttributes` (`encryption/encryptable-record.ts`), `EncryptedUniquenessValidator`
(`encryption/extended-deterministic-uniqueness-validator.ts`) and `Scheme#withContext`
(`encryption/scheme.ts`) all open async blocks, so a `Promise.all` over two encrypted-record
operations can encrypt or decrypt under the wrong context.

This is the same gap CLAUDE.md § "The adapter lock defaults to a monitor, not `NullLock`" records
for the adapter: one async context can hold many in-flight promises. The converged behaviour is
Rails' — each block sees the context it opened until it returns. The likely lever is running an
async block in its own execution context seeded with a copy of the caller's stack (the
`withExecutionContext` / `Thread` analogue), so a sibling's push is not visible and each pop removes
its own entry; confirm against how ruby-compat's `synchronize` solved the same sibling problem
(`packages/ruby-compat/src/monitor.ts`).

## Acceptance criteria

- [ ] Two async `withEncryptionContext` blocks started under one `Promise.all` each read their own context for their whole duration, and the stack is empty after both settle — a regression test in `contexts.trails.test.ts` that fails on the current code.
- [ ] A nested block (opened inside another block's body) still sees and restores the outer context, as `contexts.rb:33-43` gives it.
- [ ] The synchronous path is unchanged and `with_encryption_context`'s body stays line-for-line with `contexts.rb:33-43`; `pnpm parity:api:calls` / `parity:api:calls:args` stay green.
