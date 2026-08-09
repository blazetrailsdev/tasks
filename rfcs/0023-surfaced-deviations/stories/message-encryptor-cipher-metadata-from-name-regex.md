---
title: "MessageEncryptor derives cipher key/iv length and AEAD-ness from the cipher name"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence story: the story states the name-regex metadata is correct for the aes-*-{cbc,gcm} family Rails and trails use; the rest is hardening for cipher names outside the ported surface, with no Rails counterpart to converge onto (Ruby just asks OpenSSL)."
---

## Context

PR #5963 introduced `MessageEncryptor#newCipher()` in
`packages/activesupport/src/message-encryptor.ts` as a stand-in for Ruby's
`OpenSSL::Cipher.new(@cipher)` (`message_encryptor.rb:367-368`), which trails
has no analogue for. It reports the three properties Rails reads off that
object, but derives all three from the **cipher name string** rather than from
the crypto library:

```ts
private newCipher(): { keyLen: number; ivLen: number; authenticated: boolean } {
  const authenticated = /gcm|ccm/i.test(this.cipher);
  return { keyLen: ctor.keyLen(this.cipher), ivLen: authenticated ? 12 : 16, authenticated };
}
```

and `static keyLen` is `cipher.match(/(\d+)/)` -> `n / 8`, else 32.

This is correct for the `aes-{128,192,256}-{cbc,gcm}` family that Rails and
trails actually use, and it was the right call to unblock #5963. It is wrong
for other OpenSSL cipher names a caller may legitimately pass:

- `chacha20-poly1305` — no digits, so `keyLen` falls back to 32 (correct by
  luck), but `authenticated` is `false` though it _is_ an AEAD cipher, so the
  auth tag is silently dropped and the message cannot be authenticated.
- `aes-128-cbc-hmac-sha256` — the regex takes the **first** digit run, so
  `keyLen` is 16; that happens to be right, but the pattern is positional and
  breaks on any name whose first number is not the key size.
- `aes-256-ccm` — reports `ivLen` 12; CCM nonces are 7-13 bytes and Node
  requires an explicit `authTagLength`, so this path is untested.

Rails has none of these problems because OpenSSL answers `key_len`, `iv_len`,
and `authenticated?` authoritatively per cipher.

A related, smaller item from the same gap: `decrypt`'s `catch` is broader than
Rails' `rescue OpenSSLCipherError` (`message_encryptor.rb:315-317`) — Rails
lets non-cipher errors propagate, trails converts anything thrown in the
decipher block into `invalid_message_format`. Flagged twice in #5963 review as
documented necessity, since there is no typed cipher error to narrow on.

## Acceptance criteria

- Cipher metadata (`keyLen` / `ivLen` / `authenticated`) comes from an
  authoritative source rather than name-regex — either a table of the ciphers
  trails supports that **rejects** unknown names, or an adapter method backed
  by the crypto library.
- An unsupported / unrecognised cipher raises at construction instead of
  silently producing a non-authenticated encryptor.
- `chacha20-poly1305` either works end-to-end or is rejected explicitly; it
  must not silently drop the auth tag.
- Consider narrowing `decrypt`'s catch to the crypto-adapter's cipher errors
  if the adapter can surface a distinguishable error type.
- `pnpm vitest run packages/activesupport/src/message-encryptor.test.ts
packages/activesupport/src/message-encryptor.trails.test.ts`, `pnpm
typecheck`, and `pnpm lint` pass.
