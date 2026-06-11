---
title: "Encryption MessageSerializer double-base64 wire-format divergence from MRI"
status: draft
updated: 2026-06-11
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during the encryption-cluster canonical-schema port (PR #3119).
`encryptable-record.test.ts` carries `it.skip("deterministic ciphertexts remain constant")`,
blocked on a wire-format divergence — NOT a key-derivation gap (key derivation parity is
confirmed: SHA1, 65536 iters, matching salt/password produce the correct AES key).

## The deviation

Our `MessageSerializer` stores cipher headers (`iv`, `at`) as `base64(utf8(base64_string))`
— double-base64 — because `Aes256Gcm.encrypt` adds headers as already-base64-encoded
strings and `encodeIfNeeded` re-encodes them. MRI Rails' `MessageSerializer` stores them as
a single `Base64.strict_encode64(raw_bytes)`. The decrypt path round-trips internally, so
functional encryption works; only the serialized on-disk/wire format differs from MRI. This
is the same root cause that originally (wrongly) motivated a "needs limit 1024" worry for
the encrypted-post column — measured ciphertext is actually ~134 chars, fits VARCHAR(255).

## Why it matters

- Blocks the `deterministic ciphertexts remain constant` test (which pins exact ciphertext bytes).
- Stored ciphertexts are not byte-compatible with MRI Rails — relevant only if cross-runtime
  ciphertext interop is ever required.

## Scope / risk

Fix is to change `Aes256Gcm` to store raw bytes in headers (single base64 at the serializer
boundary). This is a **breaking change for any already-stored ciphertexts**, so it needs a
migration/compat story, not a drop-in. Est ~120 LOC for the serializer change + the unskip;
more if backward-compat decoding is required.

## Acceptance criteria

- [ ] `MessageSerializer` emits single-base64 headers matching MRI `Base64.strict_encode64`.
- [ ] `deterministic ciphertexts remain constant` unskipped and passing.
- [ ] Backward-compat path (or explicit decision to break) for existing double-base64 ciphertexts.
