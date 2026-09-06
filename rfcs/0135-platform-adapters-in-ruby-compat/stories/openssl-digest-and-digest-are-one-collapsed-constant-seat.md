---
title: "OpenSSL::Digest and Digest are one collapsed constant seat, so uuid_from_hash's two arms cannot discriminate"
status: draft
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`OpenSSL::Digest::MD5` / `SHA1` / `SHA256`
(`vendor/ruby/ext/openssl/ossl_digest.c:400`) and `Digest::MD5` / `SHA1` /
`SHA256` (`vendor/ruby/ext/digest/lib/digest.rb:8`) are DISTINCT classes in
Ruby — the openssl extension's and the digest stdlib's. `packages/ruby-compat/src/openssl.ts:185`
seats one pair for both: `export const OpenSSL = { Cipher, HMAC, Digest }`
re-exports the same `Digest` object from `digest.ts`, so
`OpenSSL.Digest.MD5 === Digest.MD5` by reference identity.

That collapses a branch Rails writes as two arms.
`Digest::UUID.uuid_from_hash`
(`vendor/rails/activesupport/lib/active_support/core_ext/digest/uuid.rb:20-22`)
is:

```ruby
if hash_class == Digest::MD5 || hash_class == OpenSSL::Digest::MD5
  version = 3
elsif hash_class == Digest::SHA1 || hash_class == OpenSSL::Digest::SHA1
  version = 5
```

`packages/activesupport/src/core-ext/digest/uuid.ts:28-31` ports both arms
literally (#7576), but the second is currently redundant: no value can satisfy
one and not the other, so the port cannot tell an `OpenSSL::Digest` from a
`Digest`. Anything whose control flow turns on WHICH of the two a caller
passed is unportable today, and `hash_class.name` answers `"Digest::MD5"` for
a constant a Rails dev reached through `OpenSSL::Digest::MD5`.

Raised in review on #7576 (finding 2); the collapse predates that PR and
carries a `@noRailsEquivalent PERMANENT` receipt at `openssl.ts:177-183`
describing it as one seat for two constants.

## Converged shape

Give `OpenSSL.Digest` its own `MD5` / `SHA1` / `SHA256` `DigestClass`
instances, distinct objects from `Digest`'s, each carrying its own
`name` — `"OpenSSL::Digest::MD5"` vs `"Digest::MD5"` — so `Module#name`
(`vendor/ruby/object.c:2263`) answers the constant path the caller actually
named. Both remain over the same algorithm and the same crypto adapter; only
identity and `name` separate them. `uuid_from_hash`'s two arms then discriminate
the way `uuid.rb:20-22` does, and every existing call site keeps working
because both arms are already written.

## Acceptance criteria

- `OpenSSL.Digest.MD5 !== Digest.MD5`, likewise for SHA1 and SHA256, and each
  `name` is its own constant path.
- `uuidFromHash` accepts either seat and answers version 3 / 5 for both, with
  the `ArgumentError` naming whichever constant was passed
  (`uuid.rb:25`); `uuid.test.ts` passes unchanged.
- The `openssl.ts` receipt describing one seat for two constants is deleted
  rather than reworded.
