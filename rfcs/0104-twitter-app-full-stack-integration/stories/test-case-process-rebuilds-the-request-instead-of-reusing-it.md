---
title: "ActionController::TestCase#process rebuilds the request instead of reusing the one Rails dispatches"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestCase#process` mutates and dispatches the `@request`
that `ActionController::TestRequest.create` built
(`actionpack/lib/action_controller/test_case.rb`, the `process` body — it calls
`@request.assign_parameters(...)` and hands that same object to the controller).
So state written onto the request between calls survives the next `get`:
`test_remote_addr` (`actionpack/test/controller/test_case_test.rb:734-742`) does

```ruby
get :test_remote_addr
assert_equal "0.0.0.0", @response.body

@request.remote_addr = "192.0.0.1"
get :test_remote_addr
assert_equal "192.0.0.1", @response.body
```

trails' `process` (`packages/actionpack/src/action-controller/test-case.ts:369`)
builds a **fresh** `new Request(env)` from a literal every call and assigns it to
`this.request`, so any write to `tc.request` is discarded by the next `process`.
`this.request` also does not exist at all until the first `process` runs, where
Rails has `@request` from `setup`.

PR #7387 seeded that literal from `TestRequest.defaultEnv()`
(`actionpack/lib/action_dispatch/testing/test_request.rb:11-15`), which fixed the
first assertion — `REMOTE_ADDR` was falling through to `request.ts`'s
`"127.0.0.1"` default instead of Rails' `"0.0.0.0"` — but the second half is
still ported as a `{ env: { REMOTE_ADDR: ... } }` override rather than the
`@request.remote_addr =` write Rails makes.

## Converged shape

`process` reuses the `TestRequest` the test case already holds, the way Rails
does, rather than constructing a new `Request` per call: build it once (Rails'
`setup` / `TestRequest.create(controller_class)`), then have `process` assign the
per-call parameters and headers onto it. `test-case.test.ts`'s `remote addr` then
ports its second half as the `tc.request.remoteAddr = "192.0.0.1"` write, and
`header properly reset after remote http request` (`test_case_test.rb:743`) —
currently `it.skip` with a "scrub_env! not called post-request" note — becomes
portable for the same reason.

## Acceptance criteria

- [ ] `TestCase#process` dispatches the request the test case holds rather than a
      freshly constructed one; a write to `tc.request` before a `get` is visible
      to the action.
- [ ] `remote addr` ports Rails' `@request.remote_addr =` write verbatim.
- [ ] `pnpm parity:test:assertions` does not grow; the actioncontroller
      assertion-value mark shrinks or holds.
