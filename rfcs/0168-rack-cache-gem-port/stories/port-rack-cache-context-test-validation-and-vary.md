---
title: "Port context_test.rb:673-1033 (13 cases): validation, HEAD, POST invalidation, Vary and failure handling"
status: draft
updated: 2026-09-28
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-context-test-harness"]
deps-rfc: []
est-loc: 400
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last third of `vendor/rack-cache/v1.17.0/test/context_test.rb` (1,033 lines, 51 cases,
`describe Rack::Cache::Context`, `:5`). The file is split across three
stories by line range so each fits a PR. This one ports **`:673-1033`**, 13 cases, none of them harness smoke cases. The
**count of record for this story is 13**,
into `packages/rack-cache/src/context.test.ts`, using the `CacheContextHelpers`
harness that `port-rack-cache-context-test-harness` ported (`test/test_helper.rb:78-187`).
Its top-level `before` / `after` (`:6-7`) are `setup_cache_context` /
`teardown_cache_context`.

The cases in this range:

- validation: `:673` stale with no validators, `:710` last-modified, `:745` etag, `:779` non-304 replaces the entry.
- HEAD: `:811` stores HEAD as `original_method`, `:824` passes HEAD through on pass, `:836` serves HEAD from a fresh cache.
- `:855` invalidates cached responses on POST.
- Vary (`describe 'with responses that include a Vary header'`, `:903`): `:914` serves when headers match, and `:933` stores one response per differing header set.
- failures and logging: `:971` passes on a metastore exception, `:996` cache-control changed to private after the fact (resets `@cache_control`, the `initialize_copy` / `cache_control=` path in `response.rb:40-44,75-90`), and `:1019` logs to `rack.logger` when present.

These are end-to-end tests of `Context` over `FakeApp`: they assert on
`response`, `cache.trace`, `app.called?` and the `x-rack-cache` header. A
case that goes red is a `Context` / `Response` / store bug. Fix the
implementation, and never the test name (CLAUDE.md). Loop-generated cases
(`it "… #{x} …"` inside an `each`) count once in `parity:test` and are
ported as the same loop.

## Acceptance criteria

- [ ] All 13 cases in `:673-1033` are ported with Rails-identical names and
      assertions.
- [ ] Any `Context` fix they need lands in the same PR, and
      `pnpm parity:api:calls` / `:calls:args` stay green.
- [ ] `pnpm parity:test` credits the 13 cases.
