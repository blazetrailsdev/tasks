---
title: "Config#support_sha1_for_non_deterministic_encryption= is a behavioral writer, not stored state"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6094
claim: "2026-08-04T21:35:01Z"
assignee: "model-name-human-takes-options"
blocked-by: null
closed-reason: null
---

## Context

`Config#support_sha1_for_non_deterministic_encryption=`
(activerecord/lib/active_record/encryption/config.rb:28-33) is a **writer with
behavior**, not stored state: when the value is truthy and `has_primary_key?`,
it builds a SHA1 `KeyGenerator` and a `DerivedSecretKeyProvider` over the
primary key and calls `add_previous_scheme key_provider: sha1_key_provider`.
Nothing reads a `@support_sha1_for_non_deterministic_encryption` ivar back —
`config.rb:9-12`'s `attr_accessor` list does not contain the name.

`packages/activerecord/src/encryption/config.ts:53` instead declares it as a
plain stored `boolean` field defaulting to `false`. Setting it records the flag
and installs no previous scheme, so a config that asks for SHA1 support for
non-deterministic encryption silently decrypts nothing that was written under
the SHA1 digest.

## Converged shape

- Replace the stored field with a `setSupportSha1ForNonDeterministicEncryption`
  writer (the settled trails idiom for a Ruby `x=` that cannot be a TS `set`
  accessor), whose body mirrors config.rb:28-33 line for line: the
  `has_primary_key?` guard, `KeyGenerator.new(hash_digest_class: OpenSSL::Digest::SHA1)`,
  `DerivedSecretKeyProvider.new(primary_key, key_generator:)`, then
  `addPreviousScheme({ keyProvider: ... })`.
- No reader: Rails has none.
- `setDefaults` (config.rb:48-62) must not assign it — Rails' does not.

## Acceptance criteria

- [ ] `config.ts` has no stored `supportSha1ForNonDeterministicEncryption` field.
- [ ] Setting it with a primary key configured appends a previous scheme whose
      key provider derives from a SHA1 key generator; with no primary key it
      appends nothing (config.rb:29).
- [ ] Encryption suites green on all three lanes.
