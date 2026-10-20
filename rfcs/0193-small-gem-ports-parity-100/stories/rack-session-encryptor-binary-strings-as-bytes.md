---
title: "Rack::Session::Encryptor holds its BINARY Strings as Uint8Array"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages:
  - rack-session
deps: []
deps-rfc: []
est-loc: 200
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

The bridge is not limited to the two `digest` calls. `encryptor.ts` converts between latin1 strings and bytes at about 12 sites: the cipher iv, key, update and final calls (`:92-95`, `:115-119`, `:154`), `SecureRandom.randomBytes(...).toString("latin1")` (`:138`, `:194`), and both HMAC results (`:149`, `:173`). Holding BINARY data as `Uint8Array` reaches all of them, and every Ruby String operation the Rails body runs on that data: concatenation, `slice!`, the length checks and the signature compare. CLAUDE.md § "A String has no encoding tag either" rules that ruby-compat tags a `Uint8Array` only, so a string-taking arm in `HMAC.digest` that guesses latin1 is not a faithful option.

## Acceptance criteria

- [ ] `encryptor.ts` holds every BINARY String in `encryptor.rb` (secrets, iv, message secret, cipher text, signing data, signature, padding) as `Uint8Array`. No `Buffer.from(x, "latin1")` or `.toString("latin1")` is left in the file except where Rails itself converts to a String (the base64 boundary of `encrypt` / `decrypt`).
- [ ] Both `digest` calls pass `this.cipherSecret` / `messageSecret` and `this.hmacSecret` / `signingData` directly, with no conversion and no receipt. `OpenSSL.HMAC.digest` in ruby-compat is unchanged.
- [ ] The `cipher_secret_from_message_secret` and `compute_signature` `naming` rows are gone from `call-arg-mismatches.json`, and those two pairs are pinned with `tsx scripts/api-compare/body-pins.ts --pin encryptor.rb`. The `serialize_payload` / `deserialized_message` pins stay with `rack-session-encryptor-drop-json-byte-form-arm`.
- [ ] If rack-session has no remaining `naming` rows, it is added to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`). Otherwise the remaining rows are listed in the PR body. `pnpm parity:api:calls:args` stays green either way.
- [ ] `encryptor.test.ts` and `encryptor.trails.test.ts` pass unchanged. A new `encryptor.trails.test.ts` case decrypts a cookie produced by the encryptor on `origin/main` before the change, committed as a fixture string, so the wire format is shown to be identical.
