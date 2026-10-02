---
title: "Port Connection::ClientSocket and Connection::WebSocket over the npm websocket-driver"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-stream"]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/client_socket.rb` (159 lines), **Tier 2**, and
`connection/web_socket.rb` (45), Tier 1.

**The driver.** The npm `websocket-driver` (faye/websocket-driver-node 0.7.5,
Apache-2.0, by the author of the Ruby gem the gemspec names at
`actioncable.gemspec:39`). It ships no types and there is no `@types`
package, so this story writes the declarations for the surface used, in the
package. Add it as an optional peer and a devDependency. Read against its
source, the calls `client_socket.rb` makes all exist with the same names:
`on("open" | "message" | "close" | "error")` with `e.data`, `e.reason`,
`e.code`, `e.message`; `start()`; `text()`; `binary()`;
`close(reason, code)`; `parse(chunk)`; `protocol`.

Two differences:

1. **Construction.** Rails: `::WebSocket::Driver.rack(self, protocols:
protocols)` (`:49`), which reads `env` and `url` off the socket object.
   npm: `Driver.http(request, { protocols })`, which reads
   `request.headers` (lower-case names), `request.url` and
   `request.method`. Build that request-shaped object from the Rack env
   (`REQUEST_METHOD`, the `HTTP_*` keys, the request URI). Rails' own unit
   tests construct a connection from `Rack::MockRequest.env_for` with a
   hand-rolled `rack.hijack` (`vendor/rails/v8.0.2/actioncable/test/connection/client_socket_test.rb:67-78`),
   so there is no Node `IncomingMessage` to pass (RFC Open question 1).
2. **Output.** The Ruby driver calls `socket.write(data)`. The npm driver
   emits on its `io` stream. Wire `driver.io`'s `data` to
   `ClientSocket#write`, so `write` (`:76-80`) keeps its body and its
   rescue.

`ClientSocket`: class methods `determine_url` and `secure_request?`
(`:14-27`); the four ready-state constants (`:29-32`);
`attr_reader :env, :url`; `initialize` (`:36-57`); `start_driver`
(`:59-69`); `rack_response` (`:71-74`); `write`; `transmit`
(`:82-90`); `close(code = nil, reason = nil)` (`:92-104`); `parse`;
`client_gone`; `alive?`; `protocol`; private `open`,
`receive_message`, `emit_error`, `begin_close`, `finalize_close`
(`:123-156`).

`WebSocket`: `initialize(env, event_target, event_loop, protocols:
ActionCable::INTERNAL[:protocols])` builds a `ClientSocket` only when
`::WebSocket::Driver.websocket?(env)` (`web_socket.rb:13-15`); `possible?`,
`alive?`, `transmit(...)`, `close(...)`, `protocol`, `rack_response`
(`:17-39`), each a safe-navigation delegate.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/client_socket.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/web_socket.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`Driver.websocket?(env)`** is `Driver.isWebSocket(request)` on the same request-shaped object: method `GET`, `Connection` containing `upgrade`, `Upgrade: websocket`.
- [ ] **`possible?` returns the socket or nil**, not a boolean, and `alive?` returns nil when there is no socket. Callers test truthiness; keep the values.
- [ ] **`transmit`'s `case message`**: Numeric sends `message.to_s` as text, String sends text, Array sends binary, anything else returns false. It returns false first when `@ready_state > OPEN`.
- [ ] **`close(code = nil, reason = nil)` calls `@driver.close(reason, code)`**: the arguments swap. The npm driver's `close(reason, code)` has the same order as the Ruby one.
- [ ] **The `ArgumentError`** for a code outside 1000 or 3000-4999, with its three-part message.
- [ ] **`@ready_state = CLOSING unless @ready_state == CLOSED`**, set before the driver close.
- [ ] **`begin_close` shuts the stream and then finalizes**; `finalize_close` and `open` are guarded so `on_close` and `on_open` fire once each.
- [ ] **`@close_params = ["", 1006]`** is the default passed to `on_close` when the client vanishes without a close frame.
- [ ] **`emit_error` is silent once closing** (`return if @ready_state >= CLOSING`).
- [ ] **`write`'s rescue is `rescue => e`** (StandardError) and calls `emit_error e.message`; `client_socket_test.rb:37-50` stubs the stream's `write` to raise and asserts `on_error` got `"foo"` and `client_gone` was not called.
- [ ] **`start_driver` is idempotent** and calls `@stream.hijack_rack_socket` before `@driver.start`, so the handshake response has a socket to go to. The `async.callback` arm stays.
- [ ] **`rack_response` returns `[-1, {}, []]`**, asserted by `connection/base_test.rb:49`.
- [ ] **`determine_url` and `secure_request?` read the Rack env**, with five separate header checks. They are Rails' own; do not substitute the npm driver's `determineUrl` / `isSecureRequest`, which read a Node request.
- [ ] **`e.data` for a binary frame** is a `Buffer` from the npm driver. `MessageBuffer#valid?` refuses non-Strings, so pass it through unchanged.
- [ ] **The driver is an optional peer.** Importing `client-socket.ts` without it installed must fail with a message naming the package, and `server/configuration.ts` must not import it.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`; the one construction difference carries a `@missingRailsArgs` or `@missingRailsCall … — PERMANENT` receipt citing the CLAUDE.md section, and nothing is baselined.
- [ ] `websocket-driver` is an optional peer and a devDependency, with package-local type declarations for the calls made.
- [ ] A `.trails.test.ts` drives a `ClientSocket` over a socket pair: handshake bytes reach the peer; a client text frame reaches `on_message`; `transmit` produces a frame; a close frame reaches `on_close` once with its reason and code; an out-of-range close code raises.

## Definition of done

Using `ws`, or passing a Node `IncomingMessage` through the Rack env, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/client-socket.trails.test.ts packages/actioncable/src/connection/web-socket.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
