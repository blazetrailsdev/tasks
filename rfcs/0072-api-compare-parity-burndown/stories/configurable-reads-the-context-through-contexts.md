---
title: "Configurable bypasses Contexts to reach the encryption context"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6127
claim: "2026-08-05T13:14:58Z"
assignee: "date-initialize-guess-style-fast-path"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Configurable` reads the context through the module it is mixed into:
`ActiveRecord::Encryption.context` (configurable.rb:17, 36) and
`ActiveRecord::Encryption.reset_default_context` (configurable.rb:33). In trails
that module's class is `Contexts` (`encryption/contexts.ts`).

PR #6123 changed `encryption/configurable.ts` to import `getEncryptionContext`
and `resetDefaultContext` from `encryption/context.js` directly, bypassing
`Contexts`. The reason is written at the import site: `Contexts` now imports
`EncryptingOnlyEncryptor` for `protecting_encrypted_data` (contexts.rb:57), and
`EncryptingOnlyEncryptor extends Encryptor` while `encryptor.ts` imports
`Configurable`. Going through `Contexts` puts that `extends` inside an ESM
cycle, and a graph entered at `encryptor.ts` then evaluates the subclass with
`Encryptor` still in TDZ — `ReferenceError`, reproduced in plain node.

So the deviation is real and currently forced, but it is forced by the shape of
the encryption module graph, not by TypeScript.

## Converged shape

`Configurable` names `Contexts.context` and `Contexts.resetDefaultContext()`, as
configurable.rb:17/33/36 do.

The lever is the `encryptor.ts` → `configurable.ts` edge. `Encryptor` reads
`ActiveRecord::Encryption.config`, `.cipher` and `.key_provider`
(encryptor.rb:31, 100, 108, and `packages/activerecord/src/encryption/encryptor.ts:52,146,159,258`),
which is why it imports `Configurable` at all. Breaking or deferring that one
edge — however it is done — takes the `extends` out of the cycle and lets
`Configurable` go back through `Contexts`.

Do not close this by widening the justification comment: the comment records
debt, and this story is the burndown.

## Acceptance criteria

- [ ] `encryption/configurable.ts` reads `Contexts.context` and
      `Contexts.resetDefaultContext()`, not the free functions in `context.js`.
- [ ] The cycle note at that import site is deleted.
- [ ] Verified against the real failure, not just under vitest: vitest's setup
      files happen to enter `configurable.js` first, which masks the TDZ. A
      plain-node import of the built `encryptor.js` is what reproduces it.
- [ ] Encryption suites green on all three lanes.
