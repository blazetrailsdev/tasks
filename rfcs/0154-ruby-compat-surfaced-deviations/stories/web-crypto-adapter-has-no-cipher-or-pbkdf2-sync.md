---
title: "web-crypto-adapter-has-no-cipher-or-pbkdf2-sync"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
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

## Context

`web-crypto-adapter-has-no-digest-hmac-or-cipher` settled the shape of the
`web` crypto adapter (`packages/ruby-compat/src/crypto-adapter.ts`
`wrapWebCrypto`): synchronous pure JS, recorded in
`docs/infrastructure/browser-compat-plan.md` § "The `CryptoAdapter` seam in a
browser". It shipped `createHash` / `createHmac` for MD5, SHA-1 and SHA-256
(ports of `vendor/ruby/v3.3.11/ext/digest/md5/md5.c:199`, `sha1/sha1.c:132`,
`sha2/sha2.c:449`).

Three members still resolve to the seam's throwing stub (`completeAdapter`):

- `createCipheriv` / `createDecipheriv`. The `Cipher` class
  (`ruby-compat/src/openssl.ts`) drives a synchronous streaming `update()` /
  `final()` with `setAAD` / `getAuthTag` / `setAuthTag`. Callers:
  `MessageEncryptor` (`activesupport/lib/active_support/message_encryptor.rb:191-215`,
  `aes-256-gcm` default, `aes-256-cbc` legacy) and
  `ActiveRecord::Encryption::Cipher::Aes256Gcm`
  (`activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb`).
- `pbkdf2Sync`, which `KeyGenerator#generate_key`
  (`activesupport/lib/active_support/key_generator.rb:29-31`) reaches. It is
  PBKDF2-HMAC over the HMACs the adapter now serves, plus SHA-512 if
  `hash_digest_class` asks for it.

## Acceptance criteria

- The `web` adapter serves `createCipheriv` / `createDecipheriv` for
  `aes-256-gcm` and `aes-256-cbc` synchronously, byte-identical to
  `node:crypto` (fuzz against it in the test, as the digest test does).
- The `web` adapter serves `pbkdf2Sync` for SHA-1 and SHA-256.
- The browser-compat doc table has no "none yet" row.
- No per-call-site host branch.
