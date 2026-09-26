---
title: "Migration and Encryption autoload lists are only partly mirrored (CommandRecorder…, NullEncryptor…)"
status: done
updated: 2026-09-26
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 29
pr: trails#8118
claim: "2026-09-25T23:17:02Z"
assignee: "datetime-civil-sub-minute-offset-loses-instant-on-cast"
blocked-by: null
closed-reason: null
---

## Context

Two Rails `autoload` lists are only partly mirrored after trails#8094:

- `class Migration` (`vendor/rails/activerecord/lib/active_record/migration.rb:572-576`) autoloads
  `CommandRecorder`, `Compatibility`, `JoinTable`, `ExecutionStrategy` and `DefaultStrategy`.
  `packages/activerecord/src/migration.ts` now does `extend(Migration, Autoload)` and autoloads only
  `Compatibility` (seated by `migration/compatibility.ts`). So
  `constantize("ActiveRecord::Migration::CommandRecorder")` raises `NameError` where Ruby resolves it.
- `ActiveRecord::Encryption` (`vendor/rails/activerecord/lib/active_record/encryption.rb:10-35`)
  eager-autoloads 26 constants (`AutoFilteredParameters` ... `Scheme`). The `Encryption` namespace in
  `packages/activerecord/src/namespaces.ts` autoloads only `Cipher` and `Configurable`, so
  `constantize("ActiveRecord::Encryption::NullEncryptor")` etc. do not resolve, and
  `Encryption.eagerLoadBang()` loads only those two.

## Acceptance criteria

- `migration.ts` autoloads the remaining four constants on the `Migration` class with Rails' explicit
  paths, each seated by its defining module (or by `migration.ts` where seating from the defining
  module would close an import cycle, as `Cipher.Aes256Gcm` is seated in `cipher.ts`). Verify with
  plain-node `dist` entry imports.
- The `Encryption` namespace mirrors the `encryption.rb:10-35` `eager_autoload` list, each constant
  seated by its defining module, with `loadPath` entries.
- A trails test asserts `constantize` resolves a representative constant from each list.
