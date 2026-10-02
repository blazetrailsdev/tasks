---
title: "Port connection/client_socket_test.rb and connection/stream_test.rb"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-base", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/connection/client_socket_test.rb` (93 lines, 2 cases) and
`connection/stream_test.rb` (69 lines, 2 cases generated from a two-element
loop). These are the tests that drive a hijacked socket without a server:
`env["rack.hijack"] = -> { env["rack.hijack_io"] = io }`, with `io` one end
of a `Socket.pair` (`client_socket_test.rb:71-77`) or `File.open(File::NULL,
"w")` (`stream_test.rb:41`).

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/connection/client_socket_test.rb`:
  - [ ] `delegate socket errors to on_error handler` (`:37`)
  - [ ] `closes hijacked i/o socket at shutdown` (`:52`)
- `vendor/rails/v8.0.2/actioncable/test/connection/stream_test.rb`:
  - [ ] `closes socket on EOFError` (`:39`)
  - [ ] `closes socket on Errno::ECONNRESET` (`:39`)

## Fidelity traps (predicted at authoring)

- [ ] **`Socket.pair`** has no Node one-liner. Use a connected pair of `net` sockets (or a Duplex pair) so the client end can read the handshake until the blank line, as `client_socket_test.rb:83-87` does with a one-second timeout.
- [ ] **"delegate socket errors to on_error handler"** stubs the stream's `write` to raise `"foo"`, calls `client.write("boo")`, asserts `client_gone` was not called and `connection.errors == ["foo"]`.
- [ ] **"closes hijacked i/o socket at shutdown"** redefines `close` on the hijacked io and waits for it after `connection.close(reason: "testing")`. The method `StreamEventLoop#detach` calls on the io is the one the test observes.
- [ ] **The two `stream_test.rb` cases are generated** by `[ EOFError, Errno::ECONNRESET ].each`, named `"closes socket on #{closed_exception}"`. Both names must be credited. They stub the io's write method to raise and assert `client_gone` was called and `errors` is empty.
- [ ] **`client = connection.websocket.send(:websocket)`** reaches the private `ClientSocket`, and `instance_variable_get("@stream")` reaches the stream: those ivars must be readable by name.

## Acceptance criteria

- [ ] All 4 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.
- [ ] No case is parked: these four are the proof the Tier 2 files behave as Rails' do.

## Definition of done

A `PERMANENT-SKIP` on any of the four does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/client-socket.test.ts packages/actioncable/src/connection/stream.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
