---
title: "converge-message-encryptor-onto-composed-verifier"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: message-encryptor.ts:90 composes MessageVerifier with NullSerializer and frames via joinParts/extractParts (:181,:195); the hand-rolled HMAC and '--' string surgery are gone."
---

## Context

`packages/activesupport/src/message-encryptor.ts` reimplements the signing and
message framing that Rails delegates to a composed `MessageVerifier`.

Rails (`vendor/rails/activesupport/lib/active_support/message_encryptor.rb`):

- `initialize` builds `@verifier = MessageVerifier.new(sign_secret || secret,
**options, serializer: NullSerializer)` and only when `!aead_mode?`; `sign`
  and `verify` are `@verifier.create_message` / `@verifier.read_message`
  (lines 186-190, 268-274).
- `_encrypt` / `_decrypt` frame parts through `join_parts` / `extract_parts`,
  and the key length comes from `OpenSSL::Cipher#key_len` via
  `self.class.key_len`.

trails instead:

- Hand-rolls HMAC signing (`private sign` / `verify` using
  `getCrypto().createHmac(this.digest, this.signSecret)`) with no
  `MessageVerifier` involved, so the encryptor's signature layer does not
  inherit the verifier's `url_safe` handling, digest defaults, or
  `NullSerializer` framing.
- Splits and joins parts with bare `--` string surgery
  (`message.lastIndexOf("--")`, `encrypted.split("--")`) rather than
  `join_parts` / `extract_parts`.
- Derives the key length with a regex over the cipher name
  (`this.cipher.match(/(\d+)/)`), which silently returns 32 for any cipher
  whose name has no digits, where Rails asks OpenSSL.

Consequences observed while porting the rotator tests (PR #5961): the
encryptor's option handling drifts from the verifier's — `url_safe` had to be
forwarded to `Codec` by hand, and the constructor dropped its options entirely
when the sign secret was passed as an explicit `undefined`.

`aead_mode?` — the condition gating whether a verifier exists at all — is the
subject of `port-activesupport-message-encryptor-authenticated-encryption`
(PR #5963). Sequence this after that lands; the composition and the AEAD gate
are the same code path.

## Acceptance criteria

- `MessageEncryptor` signs and verifies through a composed `MessageVerifier`
  with `NullSerializer`, as Rails does, rather than a private HMAC pair.
- Part framing goes through `join_parts` / `extract_parts` analogues.
- Key length is derived from the cipher rather than a regex over its name.
- `parity:api` for `message_encryptor.rb` improves from 11/24.
- Existing `packages/activesupport/src/messages/` and
  `message-encryptor*.test.ts` suites stay green.
