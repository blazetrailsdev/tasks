---
title: "redress-crypto-adapter-as-securerandom-digest-and-openssl-cipher"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`move-crypto-adapter-into-ruby-compat` relocated
`packages/ruby-compat/src/crypto-adapter.ts` (was
`packages/activesupport/src/crypto-adapter.ts`) unchanged in shape: `getCrypto()`
is still `getCrypto()`, and `Cipher` still spells its members in the trails
adapter idiom rather than Ruby's.

The Ruby dressing is what is left. `ruby-compat` already seats
`packages/ruby-compat/src/secure-random.ts` (`SecureRandom`), so the CSPRNG half
has a home to converge onto; `Digest` (`ruby/lib/digest.rb`, `Digest::MD5`,
`Digest::SHA1`, `Digest::SHA256`) and `OpenSSL::Cipher`
(`ruby/ext/openssl/lib/openssl/cipher.rb`) have none yet.

The three novel names the extra-surface gate flags today are exactly the
OpenSSL::Cipher members that have not been re-dressed —
`Cipher#authData` (`auth_data=`), `Cipher#ivLen` (`iv_len`) and
`Cipher#randomIv` (`random_iv`) — each carrying a
`@noRailsEquivalent CONVERGEABLE` receipt pointing at this story. `keyLen`
(`key_len`), `encrypt`, `decrypt`, `key=`, `iv=`, `auth_tag`, `update` and
`final` are already the Ruby names.

## Acceptance criteria

- `SecureRandom` (`ruby/lib/securerandom.rb`) covers the `randomBytes` /
  `randomUUID` call sites through `packages/ruby-compat/src/secure-random.ts`,
  not through `getCrypto()` directly.
- `Digest::MD5` / `Digest::SHA1` / `Digest::SHA256` seat the `createHash` call
  sites; `OpenSSL::HMAC` seats `createHmac`.
- `Cipher` reads as `OpenSSL::Cipher` — the three CONVERGEABLE receipts in
  `packages/ruby-compat/src/crypto-adapter.ts` are deleted, not rewritten.
- `pnpm parity:api:extra:gate` stays green with ruby-compat pinned at novel 0.
