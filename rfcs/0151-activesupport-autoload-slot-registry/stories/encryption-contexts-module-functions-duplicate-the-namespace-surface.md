---
title: "encryption-contexts-module-functions-duplicate-the-namespace-surface"
status: draft
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
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

`vendor/rails/activerecord/lib/active_record/encryption.rb:48` does `include Contexts`, so
`with_encryption_context`, `without_encryption`, `protecting_encrypted_data`, `context`,
`current_custom_context`, `default_context` and `reset_default_context`
(`encryption/contexts.rb`) are methods of `ActiveRecord::Encryption` itself. Rails' tests
call them that way (`ActiveRecord::Encryption.without_encryption { ... }`).

`packages/activerecord/src/encryption.ts` now ports `include Contexts` as
`extend(Encryption, Contexts)`, but still exports hand-written module functions forwarding
to `Contexts` — `withEncryptionContext`, `withoutEncryption`, `protectingEncryptedData`,
`context()`, `currentCustomContext()`, `defaultContext(value?)`, `resetDefaultContext()` —
a second, invented spelling (`context()` is a call where Rails' `Encryption.context` is a
reader). They are re-exported by `encryption/index.ts` and `encryption/test-helpers.ts`,
and ~34 call sites in `encryptable-record.test.ts`, `encryptable-record-api.test.ts`,
`encryption-schemes.test.ts`, `unencrypted-attributes.test.ts` and `contexts.test.ts` use
the bare forwarders. Those test files also import `Encryption` from `test-helpers.ts` as
the `Errors::Encryption` error class, which collides with the namespace name.

## Acceptance criteria

- The `Contexts` forwarding functions in `encryption.ts` are deleted; callers call
  `Encryption.withoutEncryption(...)` etc. off the namespace (the `Errors::Encryption`
  import is spelled `Errors.Encryption` or otherwise disambiguated).
- `encryption/index.ts` / `test-helpers.ts` re-exports updated.
- `parity:api:calls`, `:args`, `:extra:gate` stay green.
