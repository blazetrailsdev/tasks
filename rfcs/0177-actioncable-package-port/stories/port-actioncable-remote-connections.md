---
title: "Port RemoteConnections and RemoteConnection"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-connection-callbacks-and-internal-channel",
    "port-actioncable-server-connections-and-base",
  ]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/remote_connections.rb` (82 lines), Tier 1. It has no Rails test file;
`client_test.rb`'s two "remote disconnect client" cases cover it end to end
(`port-actioncable-client-test-disconnect-and-restart-cases`).

- `RemoteConnections`: `attr_reader :server`, `initialize(server)`,
  `where(identifier)` (`:32-40`).
- Nested `RemoteConnection` (`:47-80`):
  `InvalidIdentifiersError < StandardError`;
  `include Connection::Identification, Connection::InternalChannel`;
  `initialize(server, ids)`; `disconnect(reconnect: true)`;
  `redefine_method :identifiers do server.connection_identifiers end`;
  protected `attr_reader :server`; private
  `set_identifier_instance_vars(ids)` and `valid_identifiers?(ids)`.

**Async.** `disconnect` returns the promise `server.broadcast` returns, so
`Server::Base#disconnect(identifiers)` does too.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/remote_connections.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`include Connection::Identification, Connection::InternalChannel`** in one call includes them in reverse order (the last argument first). It matters for the ancestor chain.
- [ ] **`redefine_method :identifiers`** replaces the `class_attribute` reader `Identification` installed, so a remote connection reads the server's configured connection class instead.
- [ ] **`set_identifier_instance_vars`** raises `InvalidIdentifiersError` unless every server identifier is a key of `ids`, then sets one ivar per pair, including pairs the server does not identify by.
- [ ] **`ids.keys` may be Symbols or Strings** (`where(id: "1")`); `identifiers.all? { |id| keys.include?(id) }` compares against Symbols.
- [ ] **`disconnect` broadcasts `{ type: "disconnect", reconnect: reconnect }`** to `internal_channel`, the private method from `InternalChannel`, which reads `connection_identifier` from the ivars just set.
- [ ] **`server` is both a protected reader here and a public one on `RemoteConnections`.**

## Acceptance criteria

- [ ] `remote_connections.rb` reads complete in `parity:api`.
- [ ] A `.trails.test.ts` with a recording server covers a valid `where(...).disconnect`, `reconnect: false`, and the `InvalidIdentifiersError` arm.

## Definition of done

A `RemoteConnection` that re-implements `connection_identifier` in place of including `Identification` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/remote-connections.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
