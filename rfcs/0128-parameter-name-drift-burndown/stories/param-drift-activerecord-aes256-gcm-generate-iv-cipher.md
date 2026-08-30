---
title: "param-drift-activerecord-aes256-gcm-generate-iv-cipher"
status: done
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7235
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-remainder-residual-four` (PR #7221) converged the
`AutoFilteredParameters#initialize` parameter row and blocked on the two
middleware rows (RFC 0106). One row remains and is neither a rename nor an
RFC 0106 dependency:

```text
  encryption/cipher/aes256_gcm.rb#generate_iv  @0  `cipher` → `deterministic`
```

`Aes256Gcm#generate_iv(cipher, clear_text)`
(`vendor/rails/activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:87-93`)
branches on the `@deterministic` ivar — not on the parameter — and its
non-deterministic arm returns `cipher.random_iv`, which mints an IV of the
cipher's `iv_len` and assigns it to the cipher. `encrypt`
(`aes256_gcm.rb:38-46`) therefore builds the `OpenSSL::Cipher` first and sets
`cipher.iv = iv` afterwards.

The port cannot: Node's `createCipheriv` takes the IV as a construction
argument, so no cipher object exists when `generateIv` runs. So
`packages/activerecord/src/encryption/cipher/aes256-gcm.ts:52` computes the IV
first and hands `generateIv` `this.deterministic`
(`aes256-gcm.ts:109`). The inverted order is already receipted at the call site
(`@missingRailsCall order:generateIv,constructor — PERMANENT`,
`@missingRailsArgs generate_iv — PERMANENT`), but the parameter-name row
(RFC 0126 / `parity:api --params`) is not covered by either tag.

Renaming `deterministic` to `cipher` would spell a lie; passing the crypto
adapter under the name `cipher` spells the same lie in the other direction.
Converging honestly needs an `OpenSSL::Cipher` analogue — a cipher object that
can mint its own random IV before the underlying Node cipher is constructed —
in `packages/activesupport/src/crypto-adapter.ts`, which is a design change
rather than a signature fix. Converging it would also retire the two
`@missingRails*` receipts above, since `encrypt` could then construct the cipher
in Rails' order.

## Acceptance criteria

- `encryption/cipher/aes256_gcm.rb#generate_iv @0` is gone from
  `scripts/api-compare/output/param-name-mismatches.json` for
  `--package activerecord`, by `generateIv` taking a cipher that can mint a
  random IV — not by renaming a differently-typed value.
- `generateIv` branches on `this.deterministic`, as `aes256_gcm.rb:88` does.
- If the cipher analogue lands, the `@missingRailsCall order:generateIv,constructor`
  and `@missingRailsArgs generate_iv` receipts on `encrypt` are retired too.
- No behaviour change: encryption/decryption round-trips and the deterministic
  IV value are unchanged.
