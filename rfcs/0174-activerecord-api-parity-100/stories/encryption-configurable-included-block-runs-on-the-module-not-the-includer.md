---
title: "encryption-configurable-included-block-runs-on-the-module-not-the-includer"
status: draft
updated: 2026-10-01
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

`ActiveRecord::Encryption::Configurable` declares its two module attributes in an `included do` block,
so they are defined on the includer, `ActiveRecord::Encryption`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/configurable.rb:9-12`):

```ruby
included do
  mattr_reader :config, default: Config.new
  mattr_accessor :encrypted_attribute_declaration_listeners
end
```

trails ports the block as a `static { ... }` initializer on the `Configurable` class itself
(`packages/activerecord/src/encryption/configurable.ts:18-21`), calling `mattrReader.call(this, ...)` /
`mattrAccessor.call(this, ...)` with `this` = `Configurable`. It works only because `mattrReader` closes
over its target, so the accessor `extend(Encryption, Configurable)` copies still reads `Configurable`'s
storage. The state lives on the module, not on the includer, and `Configurable.config` answers where Ruby's
`Configurable.config` is a `NoMethodError`.

The sibling `Contexts` was converged in trails#8312: its block is `static [included](base)`, and
`packages/activerecord/src/encryption.ts` fires it after the two `extend`s (`encryption.rb:47-48`).
`Configurable` should take the same shape.

`Configurable`'s class methods also read `ActiveRecord::Encryption.config` through the module rather than
`self` in places; `configurable.rb:21-36` is the reference for which receiver each line uses.

## Acceptance criteria

- [ ] `Configurable`'s `included do` block is `static [included](base)`, defining `config` and
      `encryptedAttributeDeclarationListeners` on the includer; `encryption.ts` fires it before
      `Contexts[included]` (the default `Context.new` reads `Encryption.config`).
- [ ] No source or test reads `Configurable.config` / `Configurable.keyProvider` / … directly; every reader
      goes through `Encryption`, as Rails spells it (`encryptor.test.ts`, `configurable.test.ts`,
      `configurable.trails.test.ts`, `contexts.test.ts`).
- [ ] Built `dist/encryption.js`, `dist/encryption/configurable.js` and `dist/base.js` import as entry
      modules under plain node with no TDZ.
- [ ] `pnpm parity:api` keeps `encryption/configurable.rb` and `encryption.rb` at 100%;
      `pnpm parity:api:extra:gate` stays green.
