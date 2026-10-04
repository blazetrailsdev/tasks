---
title: "activerecord: Aes256Gcm#decrypt rescues CipherError around the integrity raise"
status: done
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8492
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Cipher::Aes256Gcm#decrypt` raises `EncryptedContentIntegrity` INSIDE the
method body and rescues exactly three classes around it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:55-80`):

```ruby
raise ActiveRecord::Encryption::Errors::EncryptedContentIntegrity if auth_tag.nil? || auth_tag.bytes.length != 16
...
rescue OpenSSL::Cipher::CipherError, TypeError, ArgumentError
  raise ActiveRecord::Encryption::Errors::Decryption
```

`packages/activerecord/src/encryption/cipher/aes256-gcm.ts#decrypt` keeps the
integrity raise OUTSIDE its `try`, and its `catch` names no class. It has to:
ruby-compat's `OpenSSL::Cipher` (`packages/ruby-compat/src/openssl.ts`) raises a
plain `Error` from `update` / `final` / `started()` where MRI raises
`OpenSSL::Cipher::CipherError` (`vendor/ruby/v3.3.11/ext/openssl/ossl_cipher.c`,
`ossl_cipher_final`) and `ArgumentError` for a wrong-length key or iv
(`ossl_cipher_set_key`, `ossl_cipher_set_iv`), so a class-guarded catch would
let a failed authentication through and an unguarded one around the integrity
raise would downgrade it to `Decryption`.

`pnpm parity:api:arms:report --package=activerecord` shows the pair with an
`order` verdict: `try if throw if rescue throw -> if throw try if rescue throw`.

The same file also carries `_validateKeyLength`, a call Rails does not make
(`aes256_gcm.rb:34-53`); MRI's `cipher.key=` raises the `ArgumentError` it
stands in for.

## Acceptance criteria

- [ ] ruby-compat's `Cipher` raises a `CipherError` (seated as
      `OpenSSL.Cipher.CipherError`) where MRI's `ossl_cipher_update` /
      `ossl_cipher_final` do, and `ArgumentError` from `key=` / `iv=` for a
      wrong length, each with its `@noRailsEquivalent PERMANENT` receipt.
- [ ] `Aes256Gcm#decrypt` reads payload, iv and auth tag and raises
      `EncryptedContentIntegrity` inside the `try`, and its `catch` rethrows
      anything but `CipherError`, `TypeError` and `ArgumentError`.
- [ ] `_validateKeyLength` is deleted.
- [ ] The arms report shows no row for `encryption/cipher/aes256-gcm.ts`.
