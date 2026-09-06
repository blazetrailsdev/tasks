---
title: "generate_deterministic_iv HMACs a decoded key and a hardcoded iv_length"
status: done
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 44
pr: 7576
claim: "2026-09-06T19:37:30Z"
assignee: "digest-uuid-from-hash-takes-an-algorithm-string-not-the-digest-class"
blocked-by: null
closed-reason: null
---

## Context

`Aes256Gcm#generate_deterministic_iv`
(`vendor/rails/activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:96`)
is:

```ruby
OpenSSL::HMAC.digest(OpenSSL::Digest::SHA256.new, @secret, clear_text)[0, ActiveRecord::Encryption.cipher.iv_length]
```

The port (`packages/activerecord/src/encryption/cipher/aes256-gcm.ts:114-117`,
after #7492 seated `OpenSSL::HMAC`) diverges on both arguments:

- It HMACs `Buffer.from(this.secret, "base64").subarray(0, KEY_LENGTH)` where
  Rails HMACs `@secret` itself. Rails' `@secret` is whatever
  `Key#secret` handed over; the port base64-decodes and truncates it first, so
  the same secret produces a different deterministic IV than Rails would.
- It truncates to the module-local `IV_LENGTH = 12` constant where Rails reads
  `ActiveRecord::Encryption.cipher.iv_length` — a configured value, so a
  non-default cipher silently keeps 12.

`encrypt` and `_validateKeyLength` decode the same way, so the base64 decode is
a file-wide assumption about `secret`, not a one-line slip; converging it means
settling what `secret` holds at construction.

The `iv_length` half overlaps
`aes256-gcm-key-iv-length-and-validatekeylength-are-invented`, which is about
the `KEY_LENGTH`/`IV_LENGTH` constants themselves; this story is the call site.

## Acceptance criteria

- `generateDeterministicIv` passes `this.secret` to `OpenSSL.HMAC.digest` and
  truncates to `Encryption.cipher.ivLength`, matching `aes256_gcm.rb:96`.
- Whatever the file assumes about `secret`'s encoding is settled once at
  construction rather than re-decoded per method, so `encrypt`,
  `_validateKeyLength` and this body agree.
- A deterministic-encryption round trip against a Rails-produced ciphertext
  still decrypts, or the fixture is regenerated with the corrected IV and the
  change is called out as a ciphertext-format change.
