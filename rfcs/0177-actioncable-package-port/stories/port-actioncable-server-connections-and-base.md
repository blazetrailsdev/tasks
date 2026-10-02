---
title: "Port Server::Connections and Server::Base"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-server-worker",
    "port-actioncable-connection-stream-event-loop",
    "port-actioncable-server-configuration",
    "port-actioncable-server-broadcasting",
  ]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/connections.rb` (44 lines) and `server/base.rb` (109), Tier 1.
Their Rails tests (`server/base_test.rb`, `server/health_check_test.rb`) need
the async adapter and `Connection::Base` and are ported in
`port-actioncable-server-base-and-health-check-tests`.

`Connections`: `BEAT_INTERVAL = 3`; `connections`, `add_connection`,
`remove_connection` (`:16-26`); `setup_heartbeat_timer` (`:33-37`),
which memoizes `event_loop.timer(BEAT_INTERVAL) { event_loop.post {
connections.each(&:beat) } }`; `open_connections_statistics` (`:39-41`).

`Base`:

- `include Broadcasting`, `include Connections` (`:19-20`).
- `cattr_accessor :config, instance_accessor: false, default:
Configuration.new` and `attr_reader :config` (`:22-24`);
  `self.logger` and `delegate :logger, to: :config` (`:26-27`);
  `attr_reader :mutex` (`:29`).
- `initialize(config: self.class.config)` (`:31-35`).
- `call(env)` (`:38-42`): the health check arm, `setup_heartbeat_timer`,
  then `config.connection_class.call.new(self, env).process`.
- `disconnect(identifiers)` (`:46-48`), `restart` (`:50-64`).
- Four lazy readers of the shape `@x || @mutex.synchronize { @x ||= … }`:
  `remote_connections`, `event_loop`, `worker_pool`, `pubsub`
  (`:67-98`); `connection_identifiers` (`:102-104`).
- `ActiveSupport.run_load_hooks(:action_cable, Base.config)` at file end
  (`:107`). The hook's base is the **Configuration**, not the server.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/connections.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/base.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`restart` is async** (RFC "Async surface"): `@pubsub.shutdown` returns a promise, and Redis's and PostgreSQL's wait for a listener to finish. Await `halt` and `shutdown` inside the monitor; this is a section that spans an `await`, so it takes `synchronize` (CLAUDE.md § "The pool monitor…").
- [ ] **The four lazy readers do not `await`**, so their `synchronize` double-check is already atomic and is not wrapped (same section). Say so at the first one.
- [ ] **`restart` closes connections before taking the mutex** and passes `reason: INTERNAL[:disconnect_reasons][:server_restart]`.
- [ ] **`restart` leaves `@event_loop` and `@remote_connections` alone**; only the worker pool and pubsub are rebuilt on next use.
- [ ] **`connections.delete connection`** removes every `==` match; `add_connection` returns the array.
- [ ] **`setup_heartbeat_timer` is memoized with `||=`** and is never torn down by `restart`.
- [ ] **`cattr_accessor … instance_accessor: false`** plus `attr_reader :config`: the class-level config is the default for `initialize`, and an instance can hold a different one (`Server::Base.new(config: Configuration.new)` in `channel_prefix.rb:7`).
- [ ] **`delegate :logger, to: :config`** and the class-level `self.logger` are two definitions.
- [ ] **`call` is the Rack entry.** `mount ActionCable.server => path` mounts the instance; `MountableApp` (`packages/actionpack/src/action-dispatch/routing/mapper.ts:54-56`) accepts an object with `call`.
- [ ] **`env["PATH_INFO"] == config.health_check_path`**: `health_check_path` is nil by default, so the arm is off.
- [ ] **`run_load_hooks` runs at module evaluation.** Hooks registered later still fire, because `on_load` replays for an already-loaded name.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`; `Server.Base` is seated on the namespace and `ActionCable.server` returns one.
- [ ] A `.trails.test.ts`, with a recording adapter and a fake connection class, covers: `call` reaching the health check app; `call` building a connection and returning its `process` result; `restart` closing connections, halting the pool and shutting pubsub down, in that order; `on_load(:action_cable)` receiving the configuration.

## Definition of done

A `restart` that does not await the adapter's `shutdown` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/server/connections.trails.test.ts packages/actioncable/src/server/base.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
