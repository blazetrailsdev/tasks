---
title: "Port Connection::Base"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-connection-callbacks-and-internal-channel",
    "port-actioncable-connection-subscriptions-and-message-buffer",
    "port-actioncable-connection-client-socket-and-web-socket",
    "port-actioncable-server-connections-and-base",
  ]
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/base.rb` (294 lines, about 190 of code), Tier 1. Its
constructor builds a `Connection::WebSocket` unconditionally (`:73`), which
is why the socket classes land first. Its Rails tests are split across four
stories.

- Five includes: `Identification`, `InternalChannel`, `Authorization`,
  `Callbacks`, `ActiveSupport::Rescuable` (`:58-62`).
- `attr_reader :server, :env, :subscriptions, :logger, :worker_pool,
:protocol`; `delegate :event_loop, :pubsub, :config, to: :server`
  (`:64-65`).
- `initialize(server, env, coder: ActiveSupport::JSON)` (`:67-79`).
- Public: `process`, `receive`, `dispatch_websocket_message`,
  `handle_channel_command`, `transmit`, `close(reason: nil, reconnect:
true)`, `send_async`, `statistics`, `beat`, `on_open`,
  `on_message`, `on_error`, `on_close(reason, code)`, `inspect`
  (`:85-170`).
- Private: `attr_reader :websocket, :message_buffer`, `request`,
  `cookies`, `encode`, `decode`, `handle_open`, `handle_close`,
  `send_welcome_message`, `allow_request_origin?`,
  `respond_to_successful_request`, `respond_to_invalid_request`,
  `new_tagged_logger`, and four message builders (`:173-289`).
- `ActiveSupport.run_load_hooks(:action_cable_connection, Base)` (`:294`).

**Async.** A connection's `connect` and `disconnect` do I/O, so
`handle_open`, `handle_close`, `dispatch_websocket_message` and
`handle_channel_command` are async. `process`, `receive`, `transmit`,
`close`, `beat` and the four `on_*` callbacks stay synchronous: they
write to the socket or post to the worker pool.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/base.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`connect if respond_to?(:connect)`** and the same for `disconnect`: both are optional, defined only by the subclass. `rbObjRespondTo`.
- [ ] **`handle_open` order**: read the protocol, `connect`, `subscribe_to_internal_channel`, `send_welcome_message`, `message_buffer.process!`, `server.add_connection(self)`. The `rescue UnauthorizedError` closes with `reason: unauthorized, reconnect: false` only `if websocket.alive?`, and skips everything after `connect`, including `add_connection`.
- [ ] **`handle_close` order**: log, `remove_connection`, `unsubscribe_from_all`, `unsubscribe_from_internal_channel`, then `disconnect`. Await each.
- [ ] **`request` reads `Rails.application.env_config`** when `defined?(Rails.application) && Rails.application`: `TopLevel.Trails?.application` (CLAUDE.md § "Call-time constant resolution"), merged under `env`. `envConfig` is at `packages/trailties/src/application.ts:241`.
- [ ] **`cookies` is `request.cookie_jar`** (`packages/actionpack/src/action-dispatch/middleware/cookies.ts:607`). Signed and encrypted jars need the `env_config` merge to find the key generator.
- [ ] **`allow_request_origin?`** has three arms in order: protection disabled; `allow_same_origin_as_host` and `HTTP_ORIGIN == "#{proto}://#{HTTP_HOST}"`, with `proto` from `Rack::Request.new(env).ssl?`; then `Array(allowed_request_origins).any? { |o| o === env["HTTP_ORIGIN"] }`. `===` matches a Regexp and compares a String. `cross_site_forgery_test.rb` has six cases on these.
- [ ] **`respond_to_invalid_request`** closes first `if websocket.alive?`, logs twice, and returns `[404, { Rack::CONTENT_TYPE => "text/plain; charset=utf-8" }, ["Page not found"]]`.
- [ ] **`websocket.possible?` is used as a boolean** in `process` and in the log messages, where it picks `" [WebSocket]"` (leading space) or `"[non-WebSocket]"` (none). Keep the asymmetry.
- [ ] **`new_tagged_logger`**: each `log_tags` entry is called with `request` if it responds to `call`, else `tag.to_s.camelize`. A Symbol tag `:action_cable` becomes `"ActionCable"`.
- [ ] **`statistics`** returns `identifier`, `started_at`, `subscriptions` (identifiers) and `request_id` from `@env["action_dispatch.request_id"]`.
- [ ] **`beat` sends `Time.now.to_i`**, integer seconds.
- [ ] **`close` transmits the disconnect message, then closes the socket**; `reason: nil` is sent as JSON null, and `reconnect` defaults to true.
- [ ] **`inspect`** formats `object_id << 1` as `%#016x`. Use the object-id source the repo already has; do not invent one.
- [ ] **`send_async(method, *arguments)`** is `worker_pool.async_invoke(self, method, *arguments)`; Rails' tests override it on a subclass to call synchronously, so it must be an overridable instance method.
- [ ] **`on_error` only logs**; `on_close(reason, code)` ignores both arguments.
- [ ] **`decode` runs in `dispatch_websocket_message`**, inside the worker, after the `websocket.alive?` check; a late message is logged with `inspect` and dropped.
- [ ] **`coder:` default** and the forwarded-`undefined` problem: `Connection::Base.new(server, env)` must get JSON.
- [ ] **`filtered_path`** is `packages/actionpack/src/action-dispatch/http/filter-parameters.ts:52`; `request_method` at `http/request.ts:236`; `ip` at `:432`.

## Acceptance criteria

- [ ] `base.rb` reads complete in `parity:api`; every private Rails method is `private` or `protected` with `@internal`.
- [ ] `Connection.Base` is seated and `run_load_hooks(:action_cable_connection)` fires with it.
- [ ] A plain-node import of the built `connection/base.js` as the entry module succeeds.
- [ ] A `.trails.test.ts` covers an async `connect` finishing before the welcome message, and an `UnauthorizedError` from `connect` leaving the connection out of `server.connections`.

## Definition of done

A `Connection::Base` that takes a fake socket in place of `Connection::WebSocket` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/base.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
