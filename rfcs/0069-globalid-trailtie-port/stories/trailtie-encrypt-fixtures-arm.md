---
title: "Port the railtie encrypt_fixtures arm and emit the active_record_fixture_set load hook"
status: ready
updated: 2026-07-27
rfc: "0069-globalid-trailtie-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of the AutoFilteredParameters arm, surfaced by the same #5320 port.

`vendor/rails/activerecord/lib/active_record/railtie.rb:357-362`:

```ruby
ActiveSupport.on_load(:active_record_fixture_set) do
  # Encrypt Active Record fixtures
  if ActiveRecord::Encryption.config.encrypt_fixtures
    ActiveRecord::Fixture.prepend ActiveRecord::Encryption::EncryptedFixtures
  end
end
```

trails: `packages/activerecord/src/encryption/config.ts:16` has the
`encryptFixtures` flag (default `false`, reset at `:62`) and
`encryption/encrypted-fixtures.test.ts` exercises encrypted fixtures, but
`packages/activerecord/src/trailtie.ts` has no `encryptFixtures` arm at all —
so an app setting the flag gets nothing at boot. The blocker named in the
existing `trailtie.ts` comment is that the `:active_record_fixture_set` load
event is never emitted by the fixtures module.

## Acceptance criteria

- The fixtures module emits `runLoadHooks("active_record_fixture_set", ...)`
  at the point Rails does.
- `trailtie.ts` registers an `onLoad("active_record_fixture_set", ...)` arm
  gated on `Configurable.config.encryptFixtures`, mirroring railtie.rb:357-362,
  placed after the `active_record_encryption.configuration` initializer as in
  Rails.
- The deferral note in `trailtie.ts` is updated to drop this arm.
- A `RailtieTest` case covers set/unset and fails on the pre-change trailtie.
