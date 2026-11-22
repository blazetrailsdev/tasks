---
title: "Rack::Cache::Response header readers answer nil, not undefined, on a miss"
status: claimed
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-11-22T03:35:34Z"
assignee: "gate-rack-cache-extra-surface"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Headers#[]` answers `nil` for a missing key (`vendor/rack/.../lib/rack/headers.rb`, `Hash#[]`). trails' `Headers#get` (`packages/rack/lib/headers.ts:118`) inherits `Map#get`, which answers `undefined`. So `Rack::Cache::Response#vary` (`vendor/rack-cache/v1.17.0/lib/rack/cache/response.rb:251`), `#etag` and `#last_modified` answer `undefined` where Ruby answers `nil`. The port of `response_test.rb` "is nil when no Vary header is present" had to read `res.vary ?? null` to assert `toBeNull()` (`packages/rack-cache/test/response.test.ts`).

## Acceptance criteria

- [ ] Decide where the miss converges to `null`: `Headers#get`, or the `Response` readers.
- [ ] The `?? null` in the vary test is removed, and the test asserts `expect(res.vary).toBeNull()`.
