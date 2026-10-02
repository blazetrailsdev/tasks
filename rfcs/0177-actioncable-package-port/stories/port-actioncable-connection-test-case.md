---
title: "Port Connection::TestCase, TestConnection, TestCookieJar and Assertions"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-base", "port-actioncable-test-helper-and-test-case"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/test_case.rb` (243 lines, about 130 of code), Tier 1. Its
Rails test is ported in `port-actioncable-connection-test-case-test`.

- `NonInferrableConnectionError` (`:14-20`).
- `Assertions#assert_reject_connection(&block)` (`:22-31`):
  `assert_raises(Authorization::UnauthorizedError, "Expected to reject
connection but no rejection was made", &block)`.
- `TestCookies < ActiveSupport::HashWithIndifferentAccess` with `[]=`
  (`:33-38`); `TestCookieJar < TestCookies` with `signed` and
  `encrypted` (`:43-51`).
- `TestRequest < ActionDispatch::TestRequest` with `attr_accessor :session,
:cookie_jar` (`:53-55`).
- `TestConnection` (`:57-67`): `attr_reader :logger, :request` and an
  `initialize(request)` that builds a `TaggedLoggerProxy` and sets
  `@request` and `@env`.
- `TestCase::Behavior` (`:139-238`): `DEFAULT_PATH = "/cable"`;
  `class_attribute :_connection_class`; `attr_reader :connection`;
  `run_load_hooks(:action_cable_connection_test_case, self)`; class methods
  `tests`, `connection_class`, `determine_default_connection`; instance
  methods `connect(path = ActionCable.server.config.mount_path,
**request_params)`, `disconnect`, `cookies`; private
  `build_test_request(path, params: nil, headers: {}, session: {}, env: {})`.

**Async.** `connect` and `disconnect` await the connection's hooks, and
`assert_reject_connection`'s block is async.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/test_case.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`connect` allocates without initializing**: `connection_class.allocate`, then `singleton_class.include(TestConnection)`, then `send(:initialize, build_test_request(…))`. `TestConnection#initialize` replaces `Connection::Base#initialize`, so no WebSocket, server or worker pool is built. Use `rbObjSingletonClass`; do not call the real constructor.
- [ ] **`TestConnection#request` overrides the private `request`** with a public reader, so `request.params`, `request.headers` and `request.session` read the test request.
- [ ] **`TestRequest` makes `session` and `cookie_jar` writable.** `ActionDispatch::Request#cookie_jar` is a memoized reader in trails (`packages/actionpack/src/action-dispatch/middleware/cookies.ts:607`); the subclass needs a real writer.
- [ ] **`TestCookies#[]=`** unwraps `{ value: … }` and `{ "value" => … }` via `options.symbolize_keys[:value]`; the Rails test sets both shapes.
- [ ] **`signed` and `encrypted` are plain `TestCookies`**, memoized: no signing happens in a connection test.
- [ ] **`path ||= DEFAULT_PATH`** after the `mount_path` default: a nil `mount_path` falls back to `/cable`.
- [ ] **`build_test_request`**: `params.nil? ? uri.query : params.to_query`; builds `QUERY_STRING` and `PATH_INFO`, merges `env`, and merges headers through `ActionDispatch::Http::Headers.from_hash` only when `wrapped_headers.present?` (`packages/actionpack/src/action-dispatch/http/headers.ts:58`).
- [ ] **`request.session = session.with_indifferent_access`** and `request.cookie_jar = cookies` are set in `TestRequest.create(…).tap` (`packages/actionpack/src/action-dispatch/testing/test-request.ts:18`).
- [ ] **`disconnect` raises `"Must be connected!"`** with no connection, and sets `@connection = nil` after.
- [ ] **`assert_reject_connection`'s message** is asserted by a Rails case matching `/Expected to reject connection/`.
- [ ] **`**request_params`** forwards an absent kwarg; match Ruby's kwarg semantics for `params: nil`.

## Acceptance criteria

- [ ] `connection/test_case.rb` reads complete in `parity:api`.
- [ ] `ActionCable.Connection.TestCase` is exported, and `on_load(:action_cable_connection_test_case)` fires with it.
- [ ] A `.trails.test.ts` proves `connect` never runs `Connection::Base#initialize`.

## Definition of done

A `connect` that builds a real connection over a fake server does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/test-case.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
