---
title: "Port connection/base_test.rb, authorization_test.rb and cross_site_forgery_test.rb"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-base", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/connection/base_test.rb` (143 lines, 8 cases),
`connection/authorization_test.rb` (36 lines, 1) and
`connection/cross_site_forgery_test.rb` (92 lines, 6). All build
`Connection::Base` subclasses over `TestServer` from
`Rack::MockRequest.env_for` with upgrade headers. None needs a listening
server.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/connection/base_test.rb`:
  - [ ] `making a connection with invalid headers` (`:29`)
  - [ ] `websocket connection` (`:37`)
  - [ ] `rack response` (`:49`)
  - [ ] `on connection open` (`:58`)
  - [ ] `on connection close` (`:74`)
  - [ ] `connection statistics` (`:92`)
  - [ ] `explicitly closing a connection` (`:105`)
  - [ ] `rejecting a connection causes a 404` (`:116`)
- `vendor/rails/v8.0.2/actioncable/test/connection/authorization_test.rb`:
  - [ ] `unauthorized connection` (`:19`)
- `vendor/rails/v8.0.2/actioncable/test/connection/cross_site_forgery_test.rb`:
  - [ ] `disable forgery protection` (`:27`)
  - [ ] `explicitly specified a single allowed origin` (`:33`)
  - [ ] `explicitly specified multiple allowed origins` (`:39`)
  - [ ] `explicitly specified a single regexp allowed origin` (`:46`)
  - [ ] `explicitly specified multiple regexp allowed origins` (`:52`)
  - [ ] `allow same origin as host` (`:60`)

## Fidelity traps (predicted at authoring)

- [ ] **`open_connection`** builds an env with `HTTP_CONNECTION`, `HTTP_UPGRADE`, `HTTP_HOST` and `HTTP_ORIGIN` and no `rack.hijack` in `base_test.rb`; `start_driver` then has no io and the stream stays unattached. Port it as written.
- [ ] **"on connection open"** nests `assert_called_with(connection.websocket, :transmit, [{ type: "welcome" }.to_json])` around `assert_called(connection.message_buffer, :process!)`. The expected argument is the encoded JSON string.
- [ ] **"rack response"** asserts `[ -1, {}, [] ]`.
- [ ] **"rejecting a connection causes a 404"** and "making a connection with invalid headers" assert the 404 triple.
- [ ] **"connection statistics"** asserts `identifier` is blank, `started_at` is a `Time`, and `subscriptions` is `[]`.
- [ ] **The test subclasses override `send_async` to call synchronously** (`send method, *args`). With an async `handle_open`, `process` returns before it finishes, and nothing in `process` awaits the override's promise. `authorization_test.rb:29-33` asserts `transmit` and `close` were called by the time `connection.process` returns. Wait for the pending promise inside the `assert_called` block (through `wait_for_async`), and do not add an assertion Rails does not have.
- [ ] **"rejecting a connection causes a 404"** passes a `rack.hijack` whose `call` raises `"Do not call me!"`: a disallowed origin must answer 404 without hijacking.
- [ ] **`authorization_test.rb`** expects `{ type: "disconnect", reason: "unauthorized", reconnect: false }.to_json`, in that key order.
- [ ] **`cross_site_forgery_test.rb`** mutates `@server.config` per case and restores it in teardown.

## Acceptance criteria

- [ ] All 15 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/base.test.ts packages/actioncable/src/connection/authorization.test.ts packages/actioncable/src/connection/cross-site-forgery.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
