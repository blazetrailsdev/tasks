---
title: "encryption.ts forwarding functions duplicate the Configurable surface now on the Encryption namespace"
status: in-progress
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 21
pr: trails#8068
claim: "2026-09-24T23:47:57Z"
assignee: "converge-connection-adapters-slot-onto-namespace"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/encryption.rb:47` does `include Configurable` on `module Encryption`, so
`config`, `configure`, `encrypted_attribute_declaration_listeners`, `on_encrypted_attribute_declared`,
`encrypted_attribute_was_declared` and the `Context::PROPERTIES` delegators (`encryption/configurable.rb:9-18`) are
methods of `ActiveRecord::Encryption` itself.

trails#8037 made the `Encryption` namespace object (`packages/activerecord/src/namespaces.ts`) carry that surface via
`extend(Encryption, Configurable)` at the bottom of `packages/activerecord/src/encryption/configurable.ts`. But
`packages/activerecord/src/encryption.ts` (the file mirroring `encryption.rb`) still exports hand-written module
functions that forward to `Configurable` — `config()`, `encryptedAttributeDeclarationListeners(...)`, `configure()`,
`onEncryptedAttributeDeclared()`, `encryptedAttributeWasDeclared()` — a second, invented spelling of the same Rails
methods, and `config()` is a call where Rails' `Encryption.config` is a reader. The `extend` also lives in
`configurable.ts` rather than at `encryption.rb:47`'s site, because the readers never load `encryption.ts`.

## Acceptance criteria

- The `encryption.ts` forwarding functions are deleted; callers read `Encryption.config` / call
  `Encryption.configure(...)` off the namespace object, as Rails does.
- `include Configurable` / `include Contexts` (`encryption.rb:47-48`) is ported at the `encryption.rb` site if the
  load order allows it (the namespace is loaded before any reader), otherwise the placement is justified by a
  failing plain-node dist entry import.
- `parity:api:calls`, `:args`, `:extra:gate` stay green.
