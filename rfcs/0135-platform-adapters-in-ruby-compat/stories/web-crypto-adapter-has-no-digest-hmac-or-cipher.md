---
title: "The Web Crypto adapter cannot serve digest, HMAC or cipher"
status: ready
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: 49
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# The Web Crypto adapter cannot serve digest, HMAC or cipher

## Context

PR #7547 (RFC 0113 `crypto-adapter-seam-has-no-browser-arm`) gave the seam a
browser arm: `tryAutoRegisterWebCrypto()` in
`packages/ruby-compat/src/crypto-adapter.ts` registers a `web` adapter serving
`randomBytes` (`crypto.getRandomValues`), `randomUUID`, `timingSafeEqual` and
async `pbkdf2` (`crypto.subtle.importKey` + `deriveBits`).

Five `CryptoAdapter` members have no Web Crypto implementation and resolve to
seam-level throwing stubs (`completeAdapter`, same file):
`createHash`, `createHmac`, `createCipheriv`, `createDecipheriv`, `pbkdf2Sync`.
`crypto.subtle.digest` / `sign` / `encrypt` are Promise-returning, while
`HashAdapter#digest()` / `HmacAdapter#digest()` return a value and the `Cipher`
class drives a synchronous streaming `update()` / `final()`.

So in a browser these still throw
`Crypto adapter "web" does not implement createHash.`:

- `ActiveSupport::Digest` (`activesupport/lib/active_support/digest.rb:16`)
- `MessageVerifier#generate` / `#verified`
  (`activesupport/lib/active_support/message_verifier.rb:172,206`)
- `MessageEncryptor` (`activesupport/lib/active_support/message_encryptor.rb:191-215`)
- `KeyGenerator#generate_key`
  (`activesupport/lib/active_support/key_generator.rb:29-31`)
- `ActiveModel::SecurePassword` (`activemodel/lib/active_model/secure_password.rb`)

## Converged shape

Decide, once at the seam rather than per call site, which of the two shapes
these take in a browser:

1. An `await`-able twin on the seam (`createHashAsync` / `createHmacAsync`
   over `crypto.subtle`), with the sync members left throwing. This keeps the
   Ruby-shaped sync bodies intact for Node and forces every browser-reachable
   caller to pick up an async arm — the same fan-out cost that
   `serializable_hash` / `as_json` rejected an unconditional Promise for, so
   read that CLAUDE.md section before choosing it.
2. A pure-JS synchronous SHA-2 / HMAC / AES-GCM implementation registered as
   part of the `web` adapter. This buys full fidelity of the Ruby bodies with
   no call-site change, at the cost of hand-written crypto primitives in the
   repo — which is why PR #7547 did not do it.

`pbkdf2Sync` is the same decision in miniature: `pbkdf2Async` already routes
around it (`crypto-adapter.ts`), so only the sync callers are affected.

## Acceptance criteria

- [ ] The seam records which of the two shapes browser digest/HMAC/cipher takes,
      in `docs/infrastructure/browser-compat-plan.md` beside the existing
      "The `CryptoAdapter` seam in a browser" section.
- [ ] `ActiveSupport::Digest.hexdigest` works in a browser, or the doc states
      why it cannot and what a browser host registers instead.
- [ ] No per-call-site host branch: callers reach the seam unconditionally, as
      their Ruby counterparts call `OpenSSL` / `SecureRandom` unconditionally.
