---
title: "Port Rack::Session::Encryptor (encryptor.rb, 12 methods, 16 skipped tests)"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-session
packages: [rack-session]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb` (192 lines) has no `packages/rack-session/src/encryptor.ts`. 0/12: `#initialize`, `#decrypt`, `#encrypt`, `#new_cipher`, `#new_message_and_cipher_secret`, `#cipher_secret_from_message_secret`, `#set_cipher_key`, `#serializer`, `#compute_signature`, `#verify_authenticity!`, `#serialize_payload`, `#deserialized_message`. `encryptor.test.ts` holds 16 skipped stubs for `spec_session_encryptor.rb`. 0133's non-goal on this file was reversed by the repo owner on 2026-10-15 (see this RFC's Open questions). The cipher work goes through ruby-compat's OpenSSL seam; see `port-openssl-cipher-for-message-encryptor`.

## Acceptance criteria

- [ ] `parity:api` reports 12/12 for `encryptor.rb`, with no call or call-argument rows.
- [ ] All 16 `spec_session_encryptor.rb` tests run with Rails' bodies (a string-encoding assertion may be parked under trails CLAUDE.md § "A String has no encoding tag either").
