---
title: "Aes256Gcm decrypt may downgrade EncryptedContentIntegrity to Decryption error under legacy base64 fallback"
status: ready
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/encryption/cipher/aes256-gcm.ts` `decrypt()` now tries
two interpretations of iv/at/payload (`latin1` = MRI single-base64, then `base64`
= legacy double-base64 fallback) and only raises `EncryptedContentIntegrity` when
**no** interpretation yields a 16-byte auth tag. Rails raises
`EncryptedContentIntegrity` whenever `auth_tag.bytes.length != 16`
(`activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb`) to block
truncated-tag forgery.

Edge case: a forged message whose `at` is truncated under the intended (latin1)
interpretation but coincidentally decodes to 16 bytes under the base64
interpretation will attempt GCM, fail, and surface `Decryption` instead of
`EncryptedContentIntegrity`. Both reject the message (no forged plaintext is
accepted), so this is an **error-type parity** gap, not a security hole — but it
diverges from Rails' error contract and the per-key retry semantics
(`Cipher#tryToDecryptWithEach` propagates integrity errors immediately, retries
decryption errors).

## Scope

- Decide the correct precedence: e.g. evaluate the auth-tag length against the
  format actually used to store the message, or raise `EncryptedContentIntegrity`
  if the _primary_ (latin1) interpretation has a wrong-length tag regardless of
  the fallback.
- Add a test feeding a truncated-auth-tag envelope and asserting
  `EncryptedContentIntegrity`.

## Acceptance criteria

- [ ] Truncated auth tag raises `EncryptedContentIntegrity`, matching Rails, even
      when the legacy base64 fallback would coincidentally yield 16 bytes.
- [ ] Legacy double-base64 ciphertexts still decrypt.
