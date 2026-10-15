---
title: "cookie-jar-serializer-fallbacks-and-legacy-cbc-upgrade"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
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

Nine of `cookies_test.rb`'s `CookiesTest` cases are ported with Rails' bodies in
`packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts` but parked
as `it.skip` (`// BLOCKED: cookie-jar-serializer-fallbacks-and-legacy-cbc-upgrade`),
because the cookie jars in `packages/actionpack/src/action-dispatch/middleware/cookies.ts`
diverge from `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb`:

- legacy HMAC AES-CBC fallback/upgrade (`cookies.rb:705-740`): a cookie written
  with aes-256-cbc (or aes-256-gcm while `use_authenticated_cookie_encryption`
  is off) reads back `nil` (4 tests, Rails `cookies_test.rb:1050-1146`).
- wrapped values: `cookies.signed[:x] = JSONWrapper.new(45)` under `:json`
  reads back `nil` / crashes in `MessageEncryptor#extract_part`
  (`cookies_test.rb:700,790`); the JSON serializer does not call `as_json`.
- `:message_pack` jars cannot read a JSON-dumped value and re-write it as
  MessagePack (`cookies_test.rb:771,858`).
- `rotate :signed, digest: "SHA1"` under the default serializer raises
  "Unsupported serialization format" (`cookies_test.rb:1030`).

Also related: `Messages::SerializerWithFallback::MarshalWithFallback#dump`
(`activesupport/lib/active_support/messages/serializer_with_fallback.rb:63-69`)
is `Marshal.dump`, but trails' writes `"\x04\x08"` + JSON
(`packages/activesupport/src/messages/serializer-with-fallback.ts`). Swapping
in ruby-compat `Marshal` reds ~40 activesupport messages tests, so it is its
own convergence; the cookie tests use `serializer: "marshal"` where Rails
passes `Marshal`.

## Acceptance criteria

- The nine skipped tests run green with their Rails bodies.
- `MarshalWithFallback` dumps/loads through ruby-compat `Marshal`, and the
  cookie tests pass `Marshal` where Rails does.
