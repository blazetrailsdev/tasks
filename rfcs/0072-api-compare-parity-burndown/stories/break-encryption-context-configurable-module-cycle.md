---
title: "Break the Context/Configurable ESM cycle that forces three eval-time shims"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6123
claim: "2026-08-05T11:44:59Z"
assignee: "i18n-date-carries-start-and-ns"
blocked-by: null
closed-reason: null
---

## Context

Rails has no module cycle between `Context`, `Contexts` and `Configurable`:
`context.rb` reads `ActiveRecord::Encryption.config` (context.rb:38) and
`configurable.rb` reads `Context::PROPERTIES` (configurable.rb:16-19) with Ruby
constant lookup resolving at call time.

In trails the same three files form an ESM cycle —
`context.ts` → `configurable.ts` → `contexts.ts` → `context.ts` — and
`context.ts` builds a `Context` at module scope (`_defaultContext = new Context()`).
Whichever module is entered first sees the other's `class`/`const` bindings in
TDZ, so every cross-module read at eval time needs a workaround. Three now live
in `encryption/context.ts` because of it:

- `setEncryptingOnlyEncryptorFactory` (context.ts:20-23) — an injected factory
  standing in for `EncryptingOnlyEncryptor.new`
  (contexts.rb:57: `protecting_encrypted_data` names the class directly).
- `contextProperties()` (context.ts:25-40) — `Context::PROPERTIES` (context.rb:13)
  re-exposed as a hoisted function so `configurable.ts` can read the names while
  installing its delegation.
- The three unseeded `set_defaults` properties tracked by
  [[converge-context-set-defaults-remaining-three]].

## Converged shape

Break the cycle rather than adding a fourth workaround. The likely lever is the
module-scope `new Context()`: Rails' `mattr_accessor :default_context, default:
Context.new` (contexts.rb:18) also runs at load, but `Context#set_defaults` is
the only thing that reaches back into the other modules, so deferring the default
context's construction to first read may be enough to let each module's eval
finish before any cross-read happens. With the cycle gone, `contextProperties`
and `setEncryptingOnlyEncryptorFactory` both delete and `Configurable` reads
`Context.PROPERTIES` directly, as `configurable.rb:16` does.

## Acceptance criteria

- [ ] `configurable.ts` reads `Context.PROPERTIES`, not `contextProperties()`.
- [ ] `setEncryptingOnlyEncryptorFactory` is gone and `protectingEncryptedData`
      constructs `EncryptingOnlyEncryptor` directly (contexts.rb:57).
- [ ] No `@internal` cycle-shim remains in `encryption/context.ts`.
- [ ] Encryption suites green on all three lanes.
