---
title: "messages-marshal-with-fallback-uses-real-marshal"
status: ready
updated: 2026-10-16
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

`ActiveSupport::Messages::SerializerWithFallback::MarshalWithFallback`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/serializer_with_fallback.rb`,
`module MarshalWithFallback`) dumps with `Marshal.dump(object)` and loads with
`Marshal.load(dumped)`. trails' `marshalWithFallback`
(`packages/activesupport/src/messages/serializer-with-fallback.ts`) instead
prefixes `"\x04\x08"` to the JSON `cache/coder.ts` encoding, so a real Ruby
Marshal payload fails to load (`SyntaxError: Unexpected token 'I'`).
ruby-compat already exports a real `Marshal` (`packages/ruby-compat/src/marshal.ts`).

Surfaced porting `cookies_test.rb:1625-1675`
(`test_read_rails_5_2_stable_{encrypted,signed}_cookies_if_*`): the four tests
read Rails-5.2 Marshal cookies and are parked `it.skip` with
`BLOCKED: messages-marshal-with-fallback-uses-real-marshal` in
`packages/actionpack/src/action-dispatch/dispatch/cookies.test.ts`.

Swapping `dump`/`_load` to `Marshal.dump`/`Marshal.load` alone reds ~40 tests
(MessageVerifier/Encryptor metadata and rotator tests, `messages/codec`,
`SerializedCookieJars`), which round-trip values (`Time`, hashes) the
ruby-compat Marshal must also handle, so those need checking with it.

## Acceptance criteria

- `marshalWithFallback.dump` / `_load` are `Marshal.dump` / `Marshal.load`, as Rails.
- The four `read rails 5 2 stable ...` cookie tests run unskipped and pass.
- The tests parked on trails#8965 when `CookiesTest` moved onto `TestController`
  run unskipped and pass: `signed cookie using default digest`,
  `signed cookie using hybrid serializer can migrate marshal dumped value to json`,
  `raise data overflow` (Rails asserts 5522 bytes), `signed cookie using custom digest`,
  `signed cookie rotating secret and digest`,
  `encrypted cookie using hybrid serializer can migrate marshal dumped value to json`
  and `encrypted cookie rotating secret`. Each compares against real `Marshal` output.
- The activesupport messages suites stay green.
