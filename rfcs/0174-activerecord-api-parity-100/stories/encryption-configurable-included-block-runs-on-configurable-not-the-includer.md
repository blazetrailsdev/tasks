---
title: "encryption-configurable-included-block-runs-on-configurable-not-the-includer"
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

`ActiveRecord::Encryption::Configurable` declares its two accessors in its `included do` block, so
they are defined on the includer, `ActiveRecord::Encryption`:

```ruby
# vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/configurable.rb:9-12
included do
  mattr_reader :config, default: Config.new
  mattr_accessor :encrypted_attribute_declaration_listeners
end
```

`Configurable.config` does not exist in Rails; only `ActiveRecord::Encryption.config` does.

trails' `packages/activerecord/src/encryption/configurable.ts:18-21` runs both macros in a
`static {}` block on `Configurable` itself, and `extend(Encryption, Configurable)`
(`packages/activerecord/src/encryption.ts:12`) then copies the accessors onto `Encryption`. So
`Configurable.config` is a live seat with no Ruby counterpart, and ~212 test call sites (none in
`src` outside tests) read `Configurable.config` / `Configurable.configure` directly.

trails#8312 ported the sibling `Contexts` block (`contexts.rb:16-19`) the Rails way: a
`static [included](base)` on `Contexts` calling `mattrAccessor` / `threadMattrAccessor` on `base`,
fired from `encryption.ts` after the two `extend`s. `Configurable` should take the same shape so
the two `include`s at `encryption.rb:47-48` are ported alike.

## Acceptance criteria

- [ ] `Configurable`'s `included do` block is a `static [included](base)` calling `mattrReader` / `mattrAccessor` on `base`, and `encryption.ts` fires it for `Encryption` in `encryption.rb:47-48` order (before `Contexts`', whose default `Context.new` reads `Encryption.config`).
- [ ] `Configurable.config` / `Configurable.encryptedAttributeDeclarationListeners` no longer answer; every reader (the ~212 test sites) spells `Encryption.config`, `Encryption.configure(...)` as Rails does.
- [ ] Built `dist/encryption.js`, `dist/encryption/configurable.js`, `dist/encryption/encryptor.js` import as entry modules under plain node with no TDZ.
- [ ] `pnpm parity:api` keeps `encryption.rb` and `encryption/configurable.rb` at 100%; `parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` stay green.
