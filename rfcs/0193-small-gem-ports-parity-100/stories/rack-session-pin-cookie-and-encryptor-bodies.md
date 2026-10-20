---
title: "rack-session: converge and pin cookie.rb and encryptor.rb bodies (25 unpinned)"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-session
packages: ["rack-session"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-20T15:54:00Z"
assignee: "did-you-mean-pin-registry-and-null-checker-bodies"
blocked-by: null
closed-reason: null
---

## Context

Measured on trails `main` @ `5c642754f3` (2026-10-20): rack-session reports `pins: 57/82 (25 unpinned)`. The RFC's Verification requires 0 unpinned. Every unpinned pair belongs to the two files ported by `rack-session-port-cookie` and `rack-session-port-encryptor`, which landed without pinning:

- `cookie.rb` (13): `initialize`, `find_session`, `extract_session_id`, `unpacked_cookie_data`, `persistent_session_id!`, `write_session`, `delete_session`, `legacy_digest_match?`, `legacy_generate_hmac`, `encode_session_data`, `secure?`, `encode`, `decode`
- `encryptor.rb` (12): `initialize`, `decrypt`, `encrypt`, `new_cipher`, `new_message_and_cipher_secret`, `cipher_secret_from_message_secret`, `set_cipher_key`, `serializer`, `compute_signature`, `verify_authenticity!`, `serialize_payload`, `deserialized_message`

`serialize_payload` / `deserialized_message` carry the JSON byte-form arm that `rack-session-encryptor-drop-json-byte-form-arm` (blocked) removes; pin them only once converged, otherwise leave those two for that story and say so in the PR.

## Acceptance criteria

- [ ] Each pair read against `vendor/rack-session/*/lib/rack/session/{cookie,encryptor}.rb`, converged where it diverges, then pinned with `tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`.
- [ ] A forced `pnpm parity:api` reports rack-session 0 unpinned (or exactly the pairs handed to `rack-session-encryptor-drop-json-byte-form-arm`, named in the PR).
