---
title: "Port context_test.rb:1-452 (22 cases): pass, invalidate, private requests, 304s, reload and revalidate"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-context-test-harness"]
deps-rfc: []
est-loc: 380
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The first third of `vendor/rack-cache/v1.17.0/test/context_test.rb` (1,033 lines, 51 cases,
`describe Rack::Cache::Context`, `:5`). The file is split across three
stories by line range so each fits a PR. This one ports **`:1-452`**: 23 cases in the range, of which `:19` is
already ported as a smoke case by `port-rack-cache-context-test-harness`. The
**count of record for this story is 22**,
into `packages/rack-cache/src/context.test.ts`, using the `CacheContextHelpers`
harness that `port-rack-cache-context-test-harness` ported (`test/test_helper.rb:78-187`).
Its top-level `before` / `after` (`:6-7`) are `setup_cache_context` /
`teardown_cache_context`.

The cases in this range:

- pass / invalidate: `:9` passes options to the stores, `:19` non-GET/HEAD (already ported as a harness smoke case), `:29` `rack-cache.force-pass`, `:39` / `:48` OPTIONS, `:58` invalidates on each unsafe method (loop).
- private requests and ignored headers: `:69`, `:81`, `:94`, `:106`, `:118`, `:129`, `:141`.
- conditional GET: `:152` if-modified-since, `:172` if-none-match, `:192` both must match, `:222` validates private responses cached on the client.
- no-cache / reload / revalidate: `:283`, `:292`, `:319` (allow_reload), `:351`, `:381`, `:418` (allow_revalidate).

These are end-to-end tests of `Context` over `FakeApp`: they assert on
`response`, `cache.trace`, `app.called?` and the `x-rack-cache` header. A
case that goes red is a `Context` / `Response` / store bug. Fix the
implementation, and never the test name (CLAUDE.md). Loop-generated cases
(`it "… #{x} …"` inside an `each`) count once in `parity:test` and are
ported as the same loop.

## Acceptance criteria

- [ ] The remaining 22 cases in `:1-452` (all but `:19`) are ported with
      Rails-identical names and assertions.
- [ ] Any `Context` fix they need lands in the same PR, and
      `pnpm parity:api:calls` / `:calls:args` stay green.
- [ ] `pnpm parity:test` credits these 22 cases. With the harness story's
      `:19`, the range is fully credited.
