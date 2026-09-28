---
rfc: "0165-actiondispatch-middleware-parity"
title: "ActionDispatch middleware — cookies, flash, exceptions, stack and session stores to parity"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0165 — ActionDispatch middleware: cookies, flash, exceptions, stack and session stores to parity

## Summary

Take `action_dispatch/middleware/**` and `action_dispatch/log_subscriber.rb` — `Cookies` and its jars, `Flash`,
`DebugExceptions` / `DebugView` / `ExceptionWrapper` / `ShowExceptions` /
`PublicExceptions` / `ActionableExceptions`, `MiddlewareStack`, `Callbacks`,
`Executor`, `Reloader`, `RemoteIp`, `RequestId`, `SSL`, `AssumeSSL`,
`HostAuthorization`, `ServerTiming`, `Static`, `DebugLocks`, and the session
stores — to 100% on every parity axis, and port the middleware test files.

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes and gate enrollment).

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

**API** (`pnpm parity:api --package actiondispatch`), rows under 100%, all under
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/`:

| Rails file             | Methods | Missing                                                                                                                                                                 |
| ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cookies.rb`           | 46/55   | `key?`, `has_key?`, `update` (`:361`), `update_cookies_from_jar` (`:366`), `to_header` (`:373`), `clear` (`:425`), `always_write_cookie` (`:441`, 2), `escape` (`:444`) |
| `flash.rb`             | 23/27   | `key?`, `merge!`, `now_is_loaded?`, `stringify_array` (`:305`)                                                                                                          |
| `debug_exceptions.rb`  | 15/17   | `render_for_browser_request` (`:78`), `create_template` (`:116`)                                                                                                        |
| `debug_view.rb`        | 7/8     | `render` (`:48`)                                                                                                                                                        |
| `exception_wrapper.rb` | 60/61   | `spot` (`:239`)                                                                                                                                                         |
| `remote_ip.rb`         | 7/8     | `filter_proxies` (`:191`)                                                                                                                                               |

Arity: `DebugLocks#render_details(req)` (`debug_locks.rb:49`),
`HostAuthorization::DefaultResponseApp#response_body(request)`
(`host_authorization.rb:100`), `SSL#build_hsts_header(hsts)` (`ssl.rb:122`).
Inheritance: `DebugView < ActionView::Base` (`debug_view.rb:11`; trails has no
parent), `Callbacks` (`callbacks.rb:9`, which has no superclass and
`include ActiveSupport::Callbacks`; trails extends a `CallbacksBase`), `Flash` (`flash.rb:50`; trails has no `Flash` class), and
`MemCacheStore < Rack::Session::Dalli` (blocked, see prior art).

**Extra surface** (ungated): novel `statusText`, `toResponse`
(`exception-wrapper.ts`), `has` (`cookies.ts`, `flash.ts`), `initialize`
(`session/abstract-store.ts`), `resolveStore` (`session/index.ts` and the
invented `session/resolve-store.ts`); moved names on `cookies.ts` (7),
`session/cookie-store.ts` (5), `debug-locks.ts` (2), `stack.ts` (2),
`flash.ts` (2), `remote-ip.ts`, `server-timing.ts`, `session/cache-store.ts`
and `exception-wrapper.ts` (1 each).

**Call baselines:** 27 rows under `call-mismatches-exclude/actiondispatch/middleware/`,
plus 2 in `actiondispatch/log-subscriber.json` (`LogSubscriber#redirect`,
`action_dispatch/log_subscriber.rb:7-19`):
`ssl.json` 5, `flash.json` 4, `public-exceptions.json` 3,
`debug-exceptions.json` 2, `host-authorization.json` 2,
`show-exceptions.json` 2, `stack.json` 2, and one each in
`actionable-exceptions`, `cookies`, `debug-locks`, `exception-wrapper`,
`executor`, `remote-ip`, `request-id`.

**Tests** (`pnpm parity:test --package actiondispatch`):

| Rails test file                                     | Rails | OK  | Skip | Misplaced | Missing |
| --------------------------------------------------- | ----- | --- | ---- | --------- | ------- |
| `dispatch/cookies_test.rb`                          | 143   | 63  | 27   | 1         | 52      |
| `dispatch/debug_exceptions_test.rb`                 | 42    | 24  | 0    | 0         | 18      |
| `dispatch/static_test.rb`                           | 35    | 28  | 0    | 0         | 7       |
| `dispatch/session/cache_store_test.rb`              | 11    | 0   | 0    | 0         | 11      |
| `dispatch/session/mem_cache_store_test.rb`          | 9     | 0   | 0    | 0         | 9       |
| `dispatch/session/abstract_{,secure_}store_test.rb` | 5     | 0   | 0    | 0         | 5       |
| `dispatch/server_timing_test.rb`                    | 5     | 0   | 0    | 3         | 2       |
| `dispatch/middleware_stack_test.rb`                 | 28    | 25  | 0    | 0         | 3       |
| `dispatch/executor_test.rb`                         | 11    | 8   | 0    | 0         | 3       |
| `dispatch/ssl_test.rb`                              | 39    | 36  | 3    | 0         | 0       |
| `dispatch/host_authorization_test.rb`               | 41    | 39  | 2    | 0         | 0       |
| `dispatch/assume_ssl_test.rb`, `callbacks_test.rb`  | 2     | 0   | 0    | 2         | 0       |
| `dispatch/debug_locks_test.rb`                      | 1     | 0   | 0    | 0         | 1       |

## Design

### Session stores sit on the async cache store

`ActionDispatch::Session::CacheStore` (`session/cache_store.rb`) reads and writes
`Rails.cache`. Porting its tests needs the async `ActiveSupport::Cache` store
that RFC 0158's `cache-store-async-over-npm-clients` delivers, per the rule that
gem-backed ports wrap npm clients and are async from the start. `MemCacheStore`
additionally needs `Rack::Session::Dalli`, which is blocked (RFC 0141's
`memcachestore-descends-from-rack-session-dalli`); its test story depends on it
and stays unready until it lands.

### Prior art folded in by reference

| Story                                                                                                                                                                                                                                                      | RFC  | Covers                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------- |
| `middleware-stack-build-instrumented-and-instrumentation-proxy-not-ported`                                                                                                                                                                                 | 0141 | `build_instrumented`                  |
| `middleware-stack-use-drops-rails-block-argument`                                                                                                                                                                                                          | 0141 | `MiddlewareStack#use` blocks          |
| `debug-exceptions-log-error-gates-on-status-not-rescue-response`, `debug-exceptions-logger-follows-request-logger-chain`, `debug-exceptions-gates-on-wrapper-show-and-request-headers`                                                                     | 0141 | `DebugExceptions`                     |
| `exception-wrapper-backtrace-returns-memoized-locations`, `source-fragment-resolves-against-cwd-not-rails-root`                                                                                                                                            | 0141 | `ExceptionWrapper`                    |
| `remote-ip-get-ip-reads-env-not-request-readers`                                                                                                                                                                                                           | 0141 | `RemoteIp::GetIp`                     |
| `port-application-env-config-for-action-dispatch-keys`                                                                                                                                                                                                     | 0141 | `env_config` keys the middleware read |
| `memcachestore-descends-from-rack-session-dalli`                                                                                                                                                                                                           | 0141 | `MemCacheStore` (blocked)             |
| `cache-store-async-over-npm-clients`                                                                                                                                                                                                                       | 0158 | the cache store `CacheStore` needs    |
| `cookiejar-parse-shadows-rails-parse-methods`, `camelcase-rack-cookie-header-option-keys`, `converge-live-response-before-committed-onto-cookie-jar`, `converge-blocked-hosts-onto-request-readers`, `session-inspect-loaded-arm-drops-instance-variables` | 0023 | cookies, host authorization, session  |

### Prior-art status (trails `main` @ `2558bb83f4`)

Already landed: `middleware-stack-build-instrumented-and-instrumentation-proxy-not-ported`
(so `stack.rb` now measures 28/28) and `middleware-stack-use-drops-rails-block-argument`.
Blocked: `debug-exceptions-gates-on-wrapper-show-and-request-headers` and
`memcachestore-descends-from-rack-session-dalli`.

## Non-goals

- **`class Request` reopenings** in `cookies.rb` / `flash.rb` — RFC 0164's
  `request-mixin-bodies-onto-their-rails-files` moves those members.
- **Enrolling actiondispatch in the extra-surface gate** — RFC 0167 (gates).

## Alternatives considered

- **Sync session stores over a sync cache.** Rejected by the gem-backed-port
  rule above; it was tried for the cache stores in trails#8057 and closed.

## Rollout

1. API — `cookie-jar-and-flash-missing-members`,
   `exceptions-debug-view-and-remote-ip-missing-members`,
   `middleware-stack-callbacks-and-session-store-shapes`
2. Tests — `port-cookies-test-skips`, `port-cookies-test-domain-options`,
   `port-cookies-test-request-cookies-and-metadata`,
   `port-debug-exceptions-test-remainder`,
   `port-static-test-remainder-and-public-fixtures`,
   `port-small-middleware-test-remainders`,
   `port-session-abstract-and-cache-store-tests`,
   `port-mem-cache-store-test`
3. Close — `middleware-call-baselines-and-residue`

## Verification

- `pnpm parity:api --package actiondispatch` reports every `middleware/**` row
  at 100%, with no arity or inheritance row.
- `pnpm parity:api:extra --package actiondispatch` lists no file under
  `middleware/`; `session/resolve-store.ts` no longer exists.
- No row remains under `call-mismatches-exclude/actiondispatch/middleware/` or in
  `actiondispatch/log-subscriber.json`.
- `pnpm parity:test --package actiondispatch` reports every file in the tests
  table complete.

## Open questions

None.

## Changelog

- 2026-09-27: initial RFC
- 2026-09-27: re-measured on trails `main` @ `2558bb83f4`: `stack.rb` is 28/28 (RFC 0141 landed `build_instrumented`), so the stack row left the table; took ownership of `action_dispatch/log_subscriber.rb`'s two call rows, which no RFC covered; recorded prior-art status.
