---
title: "Port cookies_test.rb's 27 skipped tests"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "cookie-jar-and-flash-missing-members",
    "port-abstract-unit-routing-and-assertion-helpers",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/cookies_test.rb` (1675 lines) is
63/143 in `pnpm parity:test --package actiondispatch`. `CookiesTest`
(`:99-1675`) holds 27 empty skip stubs in
`packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts`: 1 in Rails
lines 250-499, 8 in 500-749, 12 in 750-999 and 6 in 1000-1249 — `secure` on
onion addresses and with `always_write_cookie`, a misspelled `same_site`,
signed and encrypted cookies across the Marshal, JSON, hybrid and MessagePack
serializers (including migration between them), custom digests and rotation,
permanent signed cookies, a jar mutated by the request persisting, and the
legacy HMAC AES-CBC fallbacks and upgrades. The
Rails tests share `CookieAssertions` (`test/abstract_unit.rb:366-483`), which
the harness ports.

One more test sits in `middleware/cookies.test.ts` and belongs here.

## Acceptance criteria

- The 27 stubs are real tests with Rails' bodies, asserting through the
  harness's `CookieAssertions`; the misplaced test moves here.
