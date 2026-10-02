---
title: "Port SubscriptionAdapter::PostgreSQL over LISTEN / NOTIFY"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "activerecord"]
deps: ["port-actioncable-inline-async-and-test-adapters"]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/postgresql.rb` (133 lines). Its Rails test needs
a PostgreSQL service and is ported in
`port-actioncable-postgresql-adapter-tests-and-ci-lane`; this story ships
the lib with a `.trails.test.ts` over a recording raw connection.

- `prepend ChannelPrefix` (`:12`).
- `broadcast` (`:19-23`): on a pooled connection,
  `NOTIFY <escaped identifier>, '<escaped payload>'`.
- `subscribe` / `unsubscribe` (`:25-31`) go to the listener with
  `channel_identifier(channel)`; `shutdown` (`:33-35`).
- `with_subscriptions_connection` (`:37-49`): a **new, un-pooled**
  connection (`ActiveRecord::Base.connection_pool.new_connection`), its raw
  connection, `SET application_name = <identifier>`, and
  `ar_conn&.disconnect!` in `ensure`.
- `with_broadcast_connection` (`:51-57`): `connection_pool.with_connection`.
- Private `channel_identifier` (SHA1 hex for names over 63 bytes),
  `listener`, `verify!` (`:60-72`).
- `Listener < SubscriberMap` (`:74-130`): a queue of `[:listen | :unlisten
| :shutdown, channel, callback]`, a thread running `listen`, which drains
  the queue and then `wait_for_notify(1)`; `shutdown`, `add_channel`,
  `remove_channel`, `invoke_callback`.

**Node.** The raw connection is a `pg.Client`
(`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts:298`),
which emits `notification` events. `pg` is already an optional peer of
activerecord; add it as one here too. `ActiveRecord::Base` is named at call
time: `TopLevel.ActiveRecord`, with no `@blazetrails/activerecord`
dependency.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/postgresql.rb`

## Fidelity traps (predicted at authoring)

- [ ] **The listener loop.** Rails polls: drain the command queue, then `wait_for_notify(1)`, forever, inside `catch :shutdown`. In Node the notification arrives as an event, so there is no poll; but the command ordering stays: each `LISTEN` / `UNLISTEN` is executed on the one subscription connection, in queue order, and a `:listen`'s success callback is posted to the event loop only after its `LISTEN` returned. A drain loop that awaits each `exec` keeps that.
- [ ] **`shutdown` waits for the listener to finish** (`Thread.pass while @thread.alive?`). In trails it awaits the listener's `Thread#value`, after pushing `[:shutdown]`.
- [ ] **The subscription connection is not pooled** and must survive `ActiveRecord::Base.connection_handler.clear_reloadable_connections!`; "clear active record connections adapter still works" asserts it.
- [ ] **`new_connection` is on the pool** (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:578`); check it is callable from outside and whether `raw_connection` needs the connection to be connected first (`connect!`).
- [ ] **`ensure ar_conn&.disconnect!`** runs when the listener leaves the block, on shutdown or on error.
- [ ] **`escape_identifier` / `escape_string`** are libpq calls on the raw connection; node-pg has `escapeIdentifier` and `escapeLiteral`. `escapeLiteral` adds its own quotes, where Rails wraps `escape_string` in `'…'` itself. Produce the same SQL text.
- [ ] **`channel.size > 63`** is a character count, and the digest is of the unprefixed-or-prefixed channel as received: `ChannelPrefix` runs first because it is prepended.
- [ ] **`verify!` raises a plain RuntimeError** when the raw connection is not a `PG::Connection`: "The Active Record database must be PostgreSQL in order to use the PostgreSQL Action Cable storage adapter".
- [ ] **`Thread.current.abort_on_exception = true`**: an error in the listener must not be swallowed.
- [ ] **`invoke_callback` posts to the event loop**, with zsuper inside the block.
- [ ] **`NOTIFY` payload limit** is 8000 bytes in PostgreSQL; Rails does not guard it, so neither does the port.

## Acceptance criteria

- [ ] `postgresql.rb` reads complete in `parity:api`; any call with no Node counterpart (`wait_for_notify`) is receipted `PERMANENT` at the call site, citing the CLAUDE.md section from `ratify-node-event-loop-stands-in-for-the-nio4r-selector` or a reason of its own, and nothing is baselined.
- [ ] `pg` is an optional peer of actioncable; resolving another adapter does not import it.
- [ ] A `.trails.test.ts` over a recording raw connection covers: the exact `NOTIFY` / `LISTEN` / `UNLISTEN` / `SET application_name` SQL text; a 101-character channel hashed to SHA1; commands executed in queue order with the success callback posted after its `LISTEN`; `shutdown` resolving after the listener ends and the connection is disconnected; the `verify!` raise.

## Definition of done

A listener that opens a pooled connection does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/subscription-adapter/postgresql.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
