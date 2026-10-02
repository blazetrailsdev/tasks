---
title: "Rack::Handler::Node offers rack.hijack on HTTP upgrade requests"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["rack", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 400
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The root story of the RFC, and independent of every other story in it.

`Connection::Stream#hijack_rack_socket` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream.rb:98-107`)
takes the client socket from the Rack env: `return unless
@socket_object.env["rack.hijack"]`, then `@rack_hijack_io =
env["rack.hijack"].call`, falling back to `env["rack.hijack_io"]`. The
connection then answers `[-1, {}, []]` (`connection/client_socket.rb:71-74`)
and writes the 101 handshake to that socket itself.

trails' handler cannot serve that:

- `packages/rack/src/handler/node.ts:70` hard-codes `env[RACK_IS_HIJACK] =
false` and never sets `rack.hijack`.
- `Node.run` (`:36-46`) registers only the request listener
  (`http.createServer((req, res) => …)`, `:39-41`). Node delivers a request
  carrying `Connection: Upgrade` to the server's `upgrade` event as
  `(req, socket, head)` once a listener exists, and `service` (`:58-108`)
  takes a `res` that an upgrade does not have.
- ruby-compat's `HttpServer` (`packages/ruby-compat/src/http-adapter.ts:18-22`)
  has `listen` / `close` / `address` and no way to register an `upgrade`
  listener; `HttpAdapter#createServer` (`:24-26`) takes the request handler
  only.

`Rack::Lint` already knows the protocol: `packages/rack/src/lint.ts:162-163`
requires a callable `rack.hijack` whenever `rack.hijack?` is true.

What this story adds:

1. An `upgrade` registration on ruby-compat's `HttpServer` / `HttpAdapter`,
   for the Node adapter.
2. An upgrade path in `Handler.Node` that builds the env with `metaVars`
   (`:110-143`), sets `rack.hijack?` to `true`, and sets `rack.hijack` to a
   function that marks the request hijacked, stores the socket under
   `rack.hijack_io` and returns it. Any `head` bytes Node already read are
   pushed back with `socket.unshift(head)` before the app runs, so the first
   frame is not lost.
3. After the app returns: a hijacked request writes nothing (the status is
   `-1`). A request the app did not hijack still gets its response, written to
   the raw socket as an HTTP/1.1 response, and the socket is closed. With an
   `upgrade` listener registered, Node sends every upgrade request there, so
   Action Cable's 404 for a disallowed origin
   (`connection/base.rb:247-253`) and its health check
   (`server/base.rb:39`) both arrive on this path.
4. Ordinary requests keep `rack.hijack?` false. Node hands the raw socket to
   the application only on upgrade.

Prior art checked (`grep -rli hijack rfcs`, `tasks touching
packages/rack/src/handler/node.ts`): no story adds hijack or an upgrade
listener. `0142/trails-server-adapts-application-to-function-rack-app` (draft)
edits `commands/server.ts` around the same `Handler.Node.run` call and does
not overlap. `0147`'s closed `request-context-minted-at-server-spawn-not-executor`
is why `service` runs in a `Thread` (`:59`); the upgrade path does the same.

## Fidelity traps (predicted at authoring)

- [ ] **`rack.hijack` returns the IO and also sets `rack.hijack_io`.** Rails reads the return value first and the env key second (`stream.rb:102-104`). Rails' own tests build `env["rack.hijack"] = -> { env["rack.hijack_io"] = io }` (`test/connection/client_socket_test.rb:77`). Provide both.
- [ ] **The app's `-1` status must not reach `writeHead`.** `res.writeHead(-1)` throws `RangeError`.
- [ ] **`head` may be non-empty.** A client that pipelines its first frame with the handshake delivers it in `head`. Dropping it loses the client's `subscribe` command.
- [ ] **No body read on the upgrade path.** `service` awaits `readBody(req)` (`:65`) before calling the app. An upgrade request's stream is the socket; reading it to the end would consume frames. `rack.input` is an empty `StringIO`.
- [ ] **The socket outlives the handler.** `Node.shutdown` (`:48-55`) calls `server.close`, which does not close upgraded sockets. Record what shutdown does with them and test it; `Server::Base#restart` closes Action Cable's own connections.
- [ ] **Socket errors.** A hijacked socket with no `error` listener crashes the process on `ECONNRESET`. The handler owns the listener until the app hijacks.

## Acceptance criteria

- [ ] An upgrade request reaches the Rack app with `rack.hijack?` true and a callable `rack.hijack`, and `Rack::Lint` accepts the env.
- [ ] Calling `rack.hijack` returns the socket and sets `rack.hijack_io`; bytes the app writes to it reach the client, and bytes the client sends (including `head`) are readable from it.
- [ ] An upgrade request the app answers without hijacking (a 404, a 200 health check) gets that response and a closed socket.
- [ ] Ordinary requests are unchanged: `rack.hijack?` is false and `parity:api` / `parity:test` for rack do not drop.
- [ ] A test opens a real listening `Handler.Node`, upgrades with a raw `net` client, and echoes bytes through the hijacked socket.

## Definition of done

Setting `rack.hijack?` to true without an `upgrade` listener, or an `upgrade` listener that bypasses the Rack app, does not close this story.
