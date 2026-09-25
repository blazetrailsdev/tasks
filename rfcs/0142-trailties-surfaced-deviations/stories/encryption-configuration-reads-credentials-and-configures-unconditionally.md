---
title: "encryption-configuration-reads-credentials-and-configures-unconditionally"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
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

# active_record_encryption.configuration skips configure and drops the credential keys

## Context

`vendor/rails/activerecord/lib/active_record/railtie.rb:337-347` calls, inside
`on_load(:active_record_encryption)`, **unconditionally**:

```ruby
ActiveRecord::Encryption.configure(
  primary_key: app.credentials.dig(:active_record_encryption, :primary_key),
  deterministic_key: app.credentials.dig(:active_record_encryption, :deterministic_key),
  key_derivation_salt: app.credentials.dig(:active_record_encryption, :key_derivation_salt),
  **app.config.active_record.encryption
)
```

`packages/trailties/src/trailties/active-record.ts`'s port (inside the
`onLoad("active_record_encryption", ...)` block since trails#8102) instead
does `if (enc && Object.keys(enc).length > 0) Encryption.configure(enc)`, with
this effect:

- the three `app.credentials.dig(:active_record_encryption, ...)` keys are
  never read, so an app's credential-held encryption keys never reach
  `Encryption.config`;
- with an empty `config.active_record.encryption`, `configure` is not called at
  all, so the `support_sha1_for_non_deterministic_encryption` default
  (`encryption/configurable.rb:25-27`) and `reset_default_context` never run.

The blocker to a line-for-line port is that `Application#credentials`
(`packages/trailties/src/application.ts:216`) is async, and the hook block is
synchronous. The fix probably reads credentials earlier in boot, or makes the
initializer await them before registering the hook. Check how other
credential-reading initializers settled this first.

## Acceptance criteria

- [ ] `Encryption.configure` is called unconditionally inside the hook, with
      `primaryKey` / `deterministicKey` / `keyDerivationSalt` from
      `app.credentials.dig("active_record_encryption", ...)` plus
      `config.activeRecord.encryption`, matching `railtie.rb:338-343`.
- [ ] RailtieTest covers the credential keys reaching `Encryption.config`.
