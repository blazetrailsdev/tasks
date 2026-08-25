---
title: "OpenSSL::Digest is modeled three incompatible ways across activesupport"
status: draft
updated: 2026-08-17
rfc: "0111-error-class-message-parity"
cluster: duplicate-error-classes
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby has one `OpenSSL::Digest` class hierarchy. trails models it three different
ways in the same package, so no digest value can be passed between them:

1. `packages/activesupport/src/key-generator.ts:18` — a hardcoded string Set:

   ```ts
   const OPENSSL_DIGESTS = new Set(["md5", "sha1", "sha256", "sha384", "sha512"]);
   ```

   standing in for Rails' `klass.kind_of?(Class) && klass < OpenSSL::Digest`
   (`vendor/rails/activesupport/lib/active_support/key_generator.rb:15-21`).

2. `packages/activesupport/src/digest.ts:3-12` — a structural
   `HashDigestClass { hexdigest(data): string }` object, with its own `TypeError`
   guard rather than Rails' `ArgumentError`.
3. `packages/activesupport/src/core-ext/digest/uuid.ts:47-60` — a bare string
   compared against `"md5"` / `"sha1"`, raising `ArgumentError`
   (`core_ext/digest/uuid.rb:19-38`).

Surfaced in PR #6641, which ported `KeyGenerator.hash_digest_class` and had to
pick one of the three. The string-Set spelling was chosen to match uuid.ts, and
the divergence is documented at that call site — but it is a deviation register
entry, not a resolution.

Consequence: `Digest.hashDigestClass = X` and `KeyGenerator.hashDigestClass = X`
accept disjoint types, the membership Set silently rejects any digest OpenSSL
supports but the literal list omits, and the error class differs across the
three (`TypeError` vs `ArgumentError`) where Rails raises `ArgumentError`
everywhere.

## Converged shape

One shared digest-class model in activesupport that all three sites name, with
Rails' `ArgumentError` and message
(`"#{klass} is expected to be an OpenSSL::Digest subclass"`), validated against
what the crypto adapter actually supports rather than a hand-maintained literal
list. `KeyGenerator`, `Digest` and `Digest::UUID` then take and return that one
type.

## Acceptance criteria

- A single digest-class representation is used by `key-generator.ts`,
  `digest.ts` and `core-ext/digest/uuid.ts`.
- The setter guard rejects non-digests with `ArgumentError` and Rails' message
  at every site.
- `key_generator_test.rb` ("With custom hash digest class", "Raises if given a
  non digest instance"), `digest_test.rb` and `core_ext/digest/uuid_test.rb`
  stay at 0 assertion mismatches.
- `OPENSSL_DIGESTS` and the bespoke `HashDigestClass` shape are both deleted.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
