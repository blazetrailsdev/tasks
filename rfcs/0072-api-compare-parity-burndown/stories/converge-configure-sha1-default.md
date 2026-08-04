---
title: "converge-configure-sha1-default"
status: ready
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

# `Configurable.configure` drops Rails' `support_sha1_for_non_deterministic_encryption` default

## Context

`ActiveRecord::Encryption::Configurable.configure`
(vendor/rails/activerecord/lib/active_record/encryption/configurable.rb:20-38)
defaults the property **after** the keys are assigned:

```ruby
# Set the default for this property here instead of in +Config#set_defaults+ as this needs
# to happen *after* the keys have been set.
properties[:support_sha1_for_non_deterministic_encryption] = true if properties[:support_sha1_for_non_deterministic_encryption].nil?
```

so every `configure` call that does not pass the key explicitly installs the
SHA1 previous scheme (`config.rb:28-33`). `packages/activerecord/src/encryption/configurable.ts`'s
`configure` never applies that default — it only forwards the properties the
caller passed.

PR #6094 converged the writer itself
(`setSupportSha1ForNonDeterministicEncryption`) and left this default out:
turning it on reds five encryption tests
(`encryption-schemes.test.ts` "use global previous schemes to decrypt data
encrypted with previous schemes" ±"with unencrypted data",
`encryptable-record.test.ts` "attribute is not accessible with the wrong key"
and "encryption schemes are resolved when used, not when declared",
`configurable.test.ts` ".configure configures initial config properties"),
because our suites call `configure` repeatedly against a shared `Config` and
each call appends another previous scheme, while Rails' encryption test
helper hands each test fresh config state.

## Acceptance criteria

- [ ] `configure` applies the `support_sha1_for_non_deterministic_encryption`
      default the way configurable.rb:26-27 does, including its placement
      after the three key assignments.
- [ ] The per-test config reset converges far enough that repeated
      `configure` calls do not accumulate duplicate previous schemes —
      compare with Rails' `ActiveRecord::Encryption` test helper.
- [ ] The five tests named above pass on all three lanes with names untouched.
