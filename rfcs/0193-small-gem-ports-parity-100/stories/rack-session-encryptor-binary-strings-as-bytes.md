---
title: "rack-session-encryptor-binary-strings-as-bytes"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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

`Rack::Session::Encryptor` (`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb`) works on BINARY-encoded Strings. The trails port (`packages/rack-session/src/encryptor.ts`) holds them as latin1 JS strings and converts each one at the `OpenSSL::HMAC.digest` call with `Buffer.from(x, "latin1")`, because ruby-compat's `OpenSSL.HMAC.digest` (`packages/ruby-compat/src/openssl.ts:186`) UTF-8 encodes a string argument. So two `naming` rows stay in `call-arg-mismatches.json`:

- `cipher_secret_from_message_secret` (`encryptor.rb:137`): `digest(constructor, @cipher_secret, message_secret)` vs TS `ref:from, ref:from`
- `compute_signature` (`encryptor.rb:152`): `digest(constructor, @hmac_secret, signing_data)` vs TS `ref:from, ref:from`

Those two bodies, with `serialize_payload` / `deserialized_message` (left to `rack-session-encryptor-drop-json-byte-form-arm`), are the four rack-session pairs left unpinned by `rack-session-pin-cookie-and-encryptor-bodies`. The `slice!` row in `initialize` was converged there, and rack-session joined the extra-surface gate (rowless).

## Acceptance criteria

- [ ] The encryptor holds its BINARY Strings as `Uint8Array` (ruby-compat's BINARY form), or HMAC.digest gets a faithful way to take a BINARY string, so both `digest` calls pass `this.cipherSecret` / `messageSecret` and `this.hmacSecret` / `signingData` with no `Buffer.from` and no receipt.
- [ ] 0 rack-session rows in `call-arg-mismatches.json`. `cipher_secret_from_message_secret` and `compute_signature` are pinned with `tsx scripts/api-compare/body-pins.ts --pin encryptor.rb` (leaving out the two pairs the drop-json story owns).
- [ ] rack-session is added to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`), and `pnpm parity:api:calls:args` stays green.
