---
title: "extend() seats super so ClassMethods load_schema! overrides need no singleton prepend"
status: in-progress
updated: 2026-10-26
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9325
claim: "2026-10-26T14:18:12Z"
assignee: "enumerable-free-functions-remaining-sites"
blocked-by: null
closed-reason: null
---

## Context

`CounterCache::ClassMethods#load_schema!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/counter_cache.rb`) and
`Encryption::EncryptableRecord`'s `load_schema!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb`)
are `ClassMethods` members. `ActiveRecord::Base` gets them by including the
concern, which extends `ClassMethods`, and each one calls `super` into
`ModelSchema::ClassMethods#load_schema!`.

trails#9304 ports them with `rbCallSuper`. It installs them through
`prepend({ prototype: Base }, { loadSchemaBang })` in
`packages/activerecord/src/base.ts`, the same singleton-as-prototype shape
`concern.ts` uses. That works because ruby-compat's `extend()` does not seat a
super slot (`rbSeatSuper` runs only from `include()` and
`rbModPrependFeatures` in `packages/ruby-compat/src/include.ts`), so
`rbCallSuper` from an extended method finds nothing.

## Converged shape

`extend()` seats the shadowed singleton method under the module method's super
slot, as `include()` does. `Base` then gets both overrides through
`extend(Base, { loadSchemaBang })`, Ruby's `extend ClassMethods`, and the
`{ prototype: Base }` prepends are deleted.

## Acceptance criteria

- [ ] `extendObject` calls `rbSeatSuper` for each function it installs, and a ruby-compat test covers `rbCallSuper` from an extended method reaching the class's own static.
- [ ] `base.ts` has no `prepend({ prototype: Base }, …)`; both `loadSchemaBang` overrides are installed by `extend`.
- [ ] `counter-cache.test.ts` and the encryptable-record tests stay green; `parity:api:calls` stays clean.
