---
title: "port-actioncable-client-test-remaining-cases"
status: done
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9311
claim: "2026-10-26T17:30:24Z"
assignee: "claude-md-register-x-over-eager-load"
blocked-by: null
closed-reason: null
---

## Context

PR trails#9310 ported the harness of `vendor/rails/v8.0.2/actioncable/test/client_test.rb` (`:1-201`) and its first four cases into `packages/actioncable/src/client.test.ts`. The remaining four cases are unported:

- `unsubscribe client` (`client_test.rb:273`): `app.connections.count`, `subscriptions.send(:subscriptions)`, `assert_called(channel, :unsubscribed)` around `c.close`.
- `remote disconnect client` (`:298`): `app.remote_connections.where(id: "1").disconnect`, reading the `disconnect` message, `wait_for_close`, `closed?`.
- `remote disconnect client with reconnect` (`:315`): the same with `disconnect(reconnect: false)`.
- `server restart` (`:332`): `ActionCable.server.restart`, then `wait_for_close`.

The `SyncClient` in client.test.ts already has `waitForClose` and `isClosed`, and `websocketClient(port, path)` takes the `"/?id=1"` path.

## Acceptance criteria

- [ ] The four cases are ported under their Rails names in `packages/actioncable/src/client.test.ts`, against the real server, and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.
