---
title: "encryption-eager-load-bang-is-an-empty-module-function"
status: ready
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption.eager_load!` (`vendor/rails/activerecord/lib/active_record/encryption.rb:50-54`)
is `super` (`ActiveSupport::Autoload#eager_load!`, `activesupport/lib/active_support/dependencies/autoload.rb`)
followed by `Cipher.eager_load!`. `Cipher` is itself `extend ActiveSupport::Autoload` with
`eager_autoload { autoload :Aes256Gcm }` (`encryption.rb:39-45`).

In trails, `packages/activerecord/src/encryption.ts` still exports `export function eagerLoadBang(): void {}`,
an empty module function. Meanwhile the `Encryption` namespace object in `packages/activerecord/src/namespaces.ts`
is `extend(Encryption, Autoload)`, so it already carries the ported async `eagerLoadBang`
(`packages/activesupport/src/dependencies/autoload.ts`). `ActiveRecord.eagerLoadBang`
(`packages/activerecord/src/active-record.ts`) calls the empty module function, not the namespace.
`encryption/cipher.ts`'s `Cipher` is not an `Autoload` namespace.

Surfaced while converging `include Configurable` / `include Contexts` onto `encryption.ts` (trails#8068).

## Acceptance criteria

- `Encryption.eagerLoadBang` on the namespace object runs the `Autoload` `eager_load!` (`super`) and then
  `Cipher.eagerLoadBang()`, with `Cipher` extended with `Autoload` and eager-autoloading `Aes256Gcm`.
- The empty `eagerLoadBang` module function in `encryption.ts` (and its `encryption/index.ts` re-export)
  is deleted; `ActiveRecord.eagerLoadBang` awaits `Encryption.eagerLoadBang()` off the namespace.
- `parity:api:calls`, `:args`, `:extra:gate` stay green.
