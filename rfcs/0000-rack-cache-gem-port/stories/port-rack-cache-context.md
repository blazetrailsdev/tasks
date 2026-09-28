---
title: "Port Rack::Cache::Context and Rack::Cache.new, with the test_helper harness"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps:
  [
    "port-rack-cache-options",
    "port-rack-cache-response",
    "port-rack-cache-meta-store-base-and-heap",
  ]
deps-rfc: []
est-loc: 480
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This is the middleware itself: what `middleware.use ::Rack::Cache, rack_cache`
mounts (`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:39`).
Paths are under `vendor/rack-cache/v1.17.0/lib/`.

- **`rack/cache.rb:42-44`**: `Rack::Cache.new(backend, options={}, &b)` →
  `Context.new(backend, options, &b)`. `Rack::Cache` is a module whose `new` is
  a module function returning a `Context`, not a class. Port it the way trails
  ports other module-level `self.new` factories (check
  `docs/ruby-ts-conventions.md`), so `stack.use(Cache, opts)` builds a
  `Context`. The `autoload`s (`:30-34`) are the § "Call-time constant
  resolution" shape only if a cycle forces it. Otherwise use plain imports.
- **`rack/cache/context.rb` (329 lines)**, `Context` (`:9`), `include Options`
  (`:10`):
  - `attr_reader :trace`, `:backend` (`:13-16`). `initialize(backend, options={})`
    (`:18-29`) `yield`s self when given a block, then derives
    `@private_header_keys` from `private_headers`.
  - `metastore` / `entitystore` (`:33-43`) resolve through
    `storage.resolve_*_uri(uri, @options)` **on every call**, so a change to the
    option takes effect at once.
  - `call(env)` (`:48-54`) runs `call!` on the receiver only when
    `rack.run_once && !rack.multithread`. Otherwise it runs `clone.call!`, a
    per-request copy. Port `clone` with Ruby's shallow-copy semantics
    (`initialize_copy` is not overridden here).
  - `call!(env)` (`:58-100`) merges defaults into env, sets
    `@request = Request.new(@env.dup.freeze)`, and dispatches GET/HEAD to
    `lookup` or `pass` (`HTTP_EXPECT`, `rack-cache.force-pass`), OPTIONS to
    `pass`, and everything else to `invalidate`. It then sets `x-rack-cache`
    from the trace, logs when `verbose?`, calls `not_modified!`, empties the HEAD
    body (closing the old one), and returns `to_a`.
  - private (`:102-328`): `record`, `private_request?`, `not_modified?`,
    `fresh_enough?`, `forward`, `pass`, `invalidate` (rescues into `log_error`),
    `lookup` (rescues metastore failures, `fault_tolerant?` arm at `:188`),
    `validate_with_stale_cache_failover` (`:202`), `validate` (`:214-261`,
    `entry.dup` at `:238`), `fetch` (`:263-285`), `store` (`:287-297`, rescue
    into `log_error` then `record :store_failed`), `strip_ignore_headers`,
    `log_error` / `log_info` / `log` (`:304-320`: `rack.logger` if present,
    else `rack.errors.write`), and `convert_head_to_get!`.

**Async.** `call` / `call!` are `async`, like every trails Rack middleware
(`packages/rack/src/etag.ts:18`), and so is each private step that reaches a
store or the backend (`forward`, `pass`, `invalidate`, `lookup`, `validate*`,
`fetch`, `store`). `@trace` and `@env` are per-request state on the clone, so a
concurrent request on the shared prototype cannot interleave with it. Keep
`clone`: it is Ruby's isolation mechanism, and in JS it is load-bearing.

`call!` is `callBang` under the bang rule in `docs/ruby-ts-conventions.md`,
and `convert_head_to_get!` becomes `convertHeadToGetBang`.

**The test harness.** `test/test_helper.rb` (218 lines) defines
`CacheContextHelpers` (`:78-187`): `FakeApp` (`:79-103`), `setup_cache_context`
(`:121`), `teardown_cache_context`, `respond_with`, `cache_config`,
`request(method, uri, opts)` over `Rack::MockRequest`, and `get` / `head` /
`post`. It also defines `create_temp_directory` / `create_temp_file`
(`:196-213`), which `port-rack-cache-disk-stores` may already have ported. Port
it once, as package test support. The three context-test stories and
`cache_test.rb` all use it. `Rack::MockRequest` is
`packages/rack/src/mock-request.ts`.

Tests in this PR: `test/cache_test.rb` (36 lines, 4 cases:
`Rack::Cache.new` returns a middleware, takes and sets options, and runs its
block) → `packages/rack-cache/src/cache.test.ts`. The 51 `context_test.rb` cases
are split across three stories that depend on this one.

## Acceptance criteria

- [ ] `src/cache.ts` ports `Rack::Cache.new`, and `src/context.ts` ports
      `Context` with every member above at its Ruby name and Ruby visibility,
      `include`ing `Options`.
- [ ] `call` clones per request under Ruby's `run_once` / `multithread` rule.
- [ ] The test_helper harness is ported as reusable test support.
- [ ] `cache.test.ts` ports the 4 cases with Rails-identical names.
- [ ] `pnpm parity:api` reports `cache.rb` and `context.rb` complete, and the call
      and call-args gates add no row.

If this exceeds the PR ceiling, move the test_helper harness into
`port-rack-cache-context-test-pass-and-revalidate` rather than splitting
`Context`.
