---
title: "activesupport: port MessagePackSharedSerializerTests into cache-serializer.test.ts"
status: done
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
cluster: null
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10374
claim: "2026-11-19T20:01:40Z"
assignee: "activesupport-time-with-zone-methods-for-time-tests"
blocked-by: null
closed-reason: null
---

## Context

trails#10233 enrolled `MessagePackSharedSerializerTests`
(`vendor/rails/v8.0.2/activesupport/test/message_pack/shared_serializer_tests.rb`)
in `parity:test`, so `MessagePackCacheSerializerTest`
(`vendor/rails/v8.0.2/activesupport/test/message_pack/cache_serializer_test.rb:8`,
`include MessagePackSharedSerializerTests`) now reports 22 shared tests missing
from `packages/activesupport/test/message-pack/cache-serializer.test.ts`
("enshrines type IDs", "includes signature in message", every "roundtrips …").
`serializer.test.ts` already ports them on an `assertRoundtrip` helper that mirrors
the private `assert_roundtrip` (`shared_serializer_tests.rb:164-171`); the cache
file has the same helper over `MessagePack.CacheSerializer`.

## Acceptance criteria

- [ ] `cache-serializer.test.ts` ports each shared test under its Rails name, on
      `assertRoundtrip`, against `MessagePack.CacheSerializer`.
- [ ] `pnpm parity:test --package activesupport` shows 0 missing for
      `message_pack/cache_serializer_test.rb`, and the assertion ratchet stays flat.
