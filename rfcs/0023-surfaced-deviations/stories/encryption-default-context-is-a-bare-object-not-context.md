---
title: "Encryption default_context defaults to {} instead of Context.new"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption::Contexts` declares
`mattr_accessor :default_context, default: Context.new`
(`vendor/rails/activerecord/lib/active_record/encryption/contexts.rb:17`), and
`reset_default_context` restores `Context.new` (contexts.rb:70-71). trails backs
the same slot with a bare object literal: `let _defaultContext: EncryptionContext = {}`
and `resetDefaultContext()` sets `{}` again
(`packages/activerecord/src/encryption/context.ts:73,82`), even though the file
defines a real `Context` class (context.ts:30) with the `keyProvider` lazy
default and `frozenEncryption` initialization Rails relies on.

Consequence: the default frame carries no `frozenEncryption` and no lazy
`keyProvider`, so every consumer that reads through `Contexts.defaultContext`
sees `undefined` where Rails sees a configured `Context`, and
`with_encryption_context`'s `default_context.dup` merge (contexts.rb:32-42,
ported at context.ts:88) spreads an empty object instead of the defaults.

Observed while converging `default_context=` onto `Contexts.defaultContext`
in PR #5406; that PR deliberately left the default value alone.

## Acceptance criteria

- `_defaultContext` is initialized to `new Context()` and `resetDefaultContext`
  restores `new Context()`, mirroring contexts.rb:17,70-71.
- The `EncryptionContext` interface and the `Context` class are reconciled (one
  of them, not two parallel shapes) so `withEncryptionContext`'s spread keeps the
  lazy `keyProvider` getter's semantics rather than flattening it.
- Encryption suite green, including `configurable.test.ts` and
  `encryptor.test.ts`, whose `resetDefaultContext` teardown depends on the value.
