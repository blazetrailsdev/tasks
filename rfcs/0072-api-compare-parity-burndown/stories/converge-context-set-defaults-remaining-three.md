---
title: "converge-context-set-defaults-remaining-three"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6117
claim: "2026-08-05T03:14:59Z"
assignee: "converge-context-set-defaults-remaining-three"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Context#set_defaults` (activerecord/lib/active_record/encryption/context.rb:29-35)
seeds five properties on every new context:

```ruby
def set_defaults
  self.frozen_encryption = false
  self.key_generator = ActiveRecord::Encryption::KeyGenerator.new
  self.cipher = ActiveRecord::Encryption::Cipher.new
  self.encryptor = ActiveRecord::Encryption::Encryptor.new
  self.message_serializer = ActiveRecord::Encryption::MessageSerializer.new
end
```

`packages/activerecord/src/encryption/context.ts` seeds only `frozenEncryption`
and `cipher` (the latter converged in PR #6114). `keyGenerator`, `encryptor` and
`messageSerializer` stay `undefined`, so a default `Context` is missing three
objects Rails guarantees, and callers compensate with `??` fallbacks
(`encryptor.ts:191` falls back to its own `_serializer`).

The blocker is an eval-time module cycle: `key-generator.ts`, `encryptor.ts` and
`message-serializer.ts` each import `Configurable`, which imports `contexts.ts`
→ `context.ts`, and `context.ts` builds a `Context` at module scope
(`_defaultContext = new Context()`). Constructing those three inside
`setDefaults` therefore runs their module bodies mid-cycle. `context.ts` already
carries two workarounds for the same cycle: the injected
`setEncryptingOnlyEncryptorFactory` and the hoisted `contextProperties()`.

## Acceptance criteria

- [ ] `Context#setDefaults` seeds all five properties `context.rb:29-35` seeds,
      or the remaining gap is reduced to whatever the cycle genuinely forces,
      with the reason at the call site.
- [ ] The `??` fallbacks that exist only because these defaults are missing
      (e.g. `encryptor.ts:191`) are removed with them.
- [ ] Encryption suites green on all three lanes.
