---
title: "Encryption readers read config off the Encryption module (include Configurable)"
status: ready
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7992 moved `Configurable` onto the `Encryption` autoload namespace (`packages/activerecord/src/namespaces.ts`),
so the encryption readers now spell `Encryption.Configurable.config.x` / `Encryption.Configurable.keyProvider`
(`encryption/{encryptor,scheme,key,key-generator,key-provider,context,encrypted-fixtures,encryptable-record}.ts`,
`encryption/cipher/aes256-gcm.ts`).

Rails reads these off the `Encryption` module itself, because `module Encryption` does `include Configurable`
(`activerecord/lib/active_record/encryption.rb:47`). `Configurable`'s `included` block adds `mattr_reader :config`
and its `class_methods` delegate `Context::PROPERTIES` (`encryption/configurable.rb:9-18`). So the call sites are
`ActiveRecord::Encryption.config.compressor` (`encryption/encryptor.rb:27`),
`ActiveRecord::Encryption.config.forced_encoding_for_deterministic_encryption` (`:173`), and so on.

## Acceptance criteria

- The `Encryption` namespace object carries `Configurable`'s surface (`config`, the delegated context properties,
  `encryptedAttributeWasDeclared`) through `include()` / `extend()` (CLAUDE.md § "Module mixins"), mirroring `encryption.rb:47`.
- Every reader spells `Encryption.config.x` / `Encryption.keyProvider`, as Rails does, and none spells
  `Encryption.Configurable.x`.
- The `parity:api:calls` / `:args` / `:extra:gate` gates stay green. A plain-node dist entry import of each encryption reader does not throw a TDZ error.
