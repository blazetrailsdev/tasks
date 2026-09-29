---
title: "Port rack-cache's test_helper CacheContextHelpers harness"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-context"]
deps-rfc: []
est-loc: 260
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every `context_test.rb` case drives `Context` through the harness in
`vendor/rack-cache/v1.17.0/test/test_helper.rb` (218 lines).
`describe Rack::Cache::Context` opens with `before { setup_cache_context }` /
`after { teardown_cache_context }` (`test/context_test.rb:6-7`). This story
ports that harness once, as package test support, so the three context-test
stories only port cases.

`CacheContextHelpers` (`test_helper.rb:78-187`):

- `FakeApp` (`:79-103`): a Rack app built from `status`, `headers`, `body` and
  an optional block. It records `called?` and has `reset!`.
- `attr_reader :app, :cache, :caches, :request, :response, :responses`, and
  `setup_cache_context` (`:121`), which resets them and a `cache_config` block.
  `teardown_cache_context` clears them.
- `respond_with(status, headers, body, &bk)` builds the `FakeApp`, and
  `cache_config(&block)` stores a block that each request's `Context` runs
  through `Rack::Cache.new(app, &block)`.
- `request(method, uri='/', opts={})` builds the stack and a
  `Rack::MockRequest` (`packages/rack/src/mock-request.ts`), and records
  `@cache`, `@caches`, `@request`, `@response`, `@responses`. `get` / `head` /
  `post` call `request` with the method.

`TestHelpers` (`:190-218`): `create_temp_directory` / `create_temp_file`.
`port-rack-cache-disk-stores` ports these first for its Disk describes. Reuse
that port here; do not duplicate it.

The harness also installs the `need_dalli` / `need_memcached` / `need_java`
guards (`:62-78`). `port-rack-cache-memcache-stores` owns their TS form, and
this story does not.

The harness is test support, not ported surface. It lives in a
`packages/rack-cache/src/**` test-support file that `parity:api` does not
measure, and it keeps the Ruby helper names (`respondWith`, `cacheConfig`, …)
so the ported cases read like the Ruby.

## Acceptance criteria

- [ ] The `CacheContextHelpers` surface above is ported as test support, with
      Ruby-named helpers and `FakeApp` recording `isCalled` / `resetBang`.
- [ ] Two `context_test.rb` smoke cases are ported against it in
      `context.test.ts`, proving the harness drives `Context` end to end:
      `:455` "fetches response from backend when cache misses" and `:19`
      "passes on non-GET/HEAD requests". These 2 cases are this story's count
      of record. `port-rack-cache-context-test-pass-and-revalidate` (22) and
      `port-rack-cache-context-test-fetch-and-freshness` (14) exclude them, so
      the four stories total 51.
- [ ] `pnpm parity:api:extra --package rack-cache` reports no new extra from
      the harness.
