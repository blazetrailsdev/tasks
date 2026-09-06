---
title: "drive-message-encryptor-through-openssl-cipher"
status: done
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 45
pr: 7576
claim: "2026-09-06T19:37:30Z"
assignee: "digest-uuid-from-hash-takes-an-algorithm-string-not-the-digest-class"
blocked-by: null
closed-reason: null
---

## Context

`MessageEncryptor#encrypt` / `#decrypt`
(`packages/activesupport/src/message-encryptor.ts:136-170`) drive the crypto
adapter directly — `getCrypto().createCipheriv(...)`, `cipher.setAAD(...)`,
`cipher.getAuthTag()` — where Rails drives `OpenSSL::Cipher`
(`activesupport/lib/active_support/message_encryptor.rb:276-303`):

```ruby
cipher = new_cipher
cipher.encrypt
cipher.key = @secret
iv = cipher.random_iv
cipher.auth_data = "" if aead_mode?
encrypted_data = cipher.update(data)
encrypted_data << cipher.final
```

`redress-crypto-adapter-as-securerandom-digest-and-openssl-cipher` (#7492)
seated `OpenSSL::Cipher` in `packages/ruby-compat/src/openssl.ts`, so the class
this body should be driving now exists. Two more bodies fall out of the same
move:

- `new_cipher` (`message_encryptor.rb:311`) is `OpenSSL::Cipher.new(@cipher)`;
  the port returns a `{ keyLen, ivLen, authenticated }` spec object computed by
  regex (`message-encryptor.ts:224`) and carries a
  `@missingRailsCall new — PERMANENT` tag for it.
- `MessageEncryptor.key_len` (`message_encryptor.rb:251`) is
  `OpenSSL::Cipher.new(cipher).key_len`; the port parses the digit run out of
  the cipher name (`message-encryptor.ts:53`) and carries the same tag.

## Acceptance criteria

- `newCipher()` returns an `OpenSSL::Cipher`, and `MessageEncryptor.keyLen`
  reads `key_len` off one, so both `@missingRailsCall new — PERMANENT` tags in
  the file are deleted rather than rewritten.
- `encrypt` / `decrypt` read as `message_encryptor.rb:276-303` — `cipher.key =`,
  `cipher.random_iv`, `cipher.auth_data =`, `cipher.update`, `cipher.final`,
  `cipher.auth_tag`, with no `getCrypto()` call left in either body.
- `aead_mode?` (`message_encryptor.rb:307`) is its own method over the cipher,
  not a regex over the cipher name held in a constructor field.
- `pnpm parity:api:calls` and `parity:api:calls:args` stay green; the
  MessageEncryptor and MessageEncryptorRotator suites pass unchanged.
