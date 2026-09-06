---
title: "Port the railtie encrypt_fixtures arm and emit the active_record_fixture_set load hook"
status: blocked
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: "missing-arm"
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: 24
pr: null
claim: "2026-09-05T20:51:57Z"
assignee: "skeleton-throw-token-carries-the-raised-class"
blocked-by: 'Re-verified 2026-09-06 against origin/main. The load-hook half of the original blocker stays CLEARED (fixtures.ts:977 runs runLoadHooks("active_record_fixture_set", FixtureSet)), but the deeper reason still holds: there is still no ActiveRecord::Fixture class and no EncryptedFixtures module to prepend onto — git grep finds only the row-array function encryptFixtureRows (fixtures.ts:468), called inline at fixtures.ts:812 behind Configurable.config.encryptFixtures. Prerequisite is the sibling story port-active-record-fixture-class-and-encrypted-fixtures-module (RFC 0113, now ready, priority 23); unblock when it lands. Path drift for the claimer: the arm''s initializer no longer lives at packages/activerecord/src/trailtie.ts — that file is gone; the active_record_encryption/fixtures initializers are now in packages/trailties/src/trailties/active-record.ts.'
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
