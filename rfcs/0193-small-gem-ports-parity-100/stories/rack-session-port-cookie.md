---
title: "Port Rack::Session::Cookie (cookie.rb, 16 methods, 48 skipped tests)"
status: claimed
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-session
packages: [rack-session]
deps: [rack-session-port-encryptor]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: "2026-10-19T19:47:49Z"
assignee: "rack-session-port-cookie"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-session/v2.1.0/lib/rack/session/cookie.rb` (313 lines) has no `cookie.ts`. 0/16: `Cookie#coder`, `#encryptors`, `#initialize`, `#find_session`, `#extract_session_id`, `#unpacked_cookie_data`, `#persistent_session_id!`, `#write_session`, `#delete_session`, `#legacy_digest_match?`, `#legacy_generate_hmac`, `#encode_session_data`, `#secure?`, `Cookie::Base64#encode`, `#decode`, `Cookie::SessionId#cookie_value`. `cookie.test.ts` holds 48 skipped stubs for `spec_session_cookie.rb`. It needs the encryptor (deps). This reverses 0133's non-goal, per the repo owner on 2026-10-15.

## Acceptance criteria

- [ ] `parity:api` reports 16/16 for `cookie.rb`, and rack-session `files` is 4/4.
- [ ] All 48 `spec_session_cookie.rb` tests run with Rails' bodies, and there are no new call or call-argument rows.
