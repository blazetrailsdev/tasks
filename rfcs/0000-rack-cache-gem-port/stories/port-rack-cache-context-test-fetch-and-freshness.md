---
title: "Port context_test.rb cases 24-38: fetch, cacheability and freshness hits"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-context"]
deps-rfc: []
est-loc: 330
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The middle third of `vendor/rack-cache/v1.17.0/test/context_test.rb` (1,033 lines, 51 cases,
`describe Rack::Cache::Context`, `:5`). The file is split across three
stories by line range so each fits a PR. This one ports **`:455-672`, 15 cases**,
into `packages/rack-cache/src/context.test.ts`, using the `CacheContextHelpers`
harness that `port-rack-cache-context` ported (`test/test_helper.rb:78-187`).
Its top-level `before` / `after` (`:6-7`) are `setup_cache_context` /
`teardown_cache_context`.

The cases in this range:

- `:455` fetches from the backend on a miss, and `:466` does not cache each non-cacheable response code (loop over codes).
- cacheability: `:477` explicit no-store, `:488` no freshness or validator, `:496` explicit no-cache, `:507` Expires, `:521` max-age, `:535` s-maxage, `:549` last-modified only, `:559` etag only.
- hits: `:569` Expires, `:593` max-age, `:617` s-maxage.
- `default_ttl`: `:641` assigned when there is no freshness info, and `:660` not assigned under must-revalidate.

These are end-to-end tests of `Context` over `FakeApp`: they assert on
`response`, `cache.trace`, `app.called?` and the `x-rack-cache` header. A
case that goes red is a `Context` / `Response` / store bug. Fix the
implementation, and never the test name (CLAUDE.md). Loop-generated cases
(`it "… #{x} …"` inside an `each`) count once in `parity:test` and are
ported as the same loop.

## Acceptance criteria

- [ ] All 15 cases in `:455-672` are ported with Rails-identical names and
      assertions.
- [ ] Any `Context` fix they need lands in the same PR, and
      `pnpm parity:api:calls` / `:calls:args` stay green.
- [ ] `pnpm parity:test` credits the 15 cases.
