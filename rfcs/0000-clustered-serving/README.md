---
rfc: "0000-clustered-serving"
title: "Clustered serving for trails server on node:cluster"
status: draft
created: 2026-11-19
updated: 2026-11-19
owner: "@deanmarano"
packages:
  - "rackup"
  - "trailties"
  - "solid-queue"
clusters:
  - cluster
  - config
  - plugins
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Clustered serving for trails server on node:cluster

## Summary

Give `trails server` the production roles Puma plays for a Rails app, built on
`node:cluster` rather than ported: several worker processes sharing one
listening socket, worker supervision, rolling and full restarts, a
`tmp/restart.txt` trigger, and Solid Queue run inside the server. The generated
app gets a `config/puma.ts` that keeps the Rails template's DSL names
(`workers`, `port`, `pidfile`, `plugin`). **Post-launch.** For launch, Puma is
permanent (RFC 0248's `trailties-gemfile-to-package-json-mapping`) and
`trails server` is one process on rackup's `Handler::Node`.

## Motivation

- Rails 8 generates `config/puma.rb`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/puma.rb.tt`):
  `threads` from `RAILS_MAX_THREADS` (`:27-28`), `port` from `PORT` (`:31`),
  `plugin :tmp_restart` (`:34`), `plugin :solid_queue if ENV["SOLID_QUEUE_IN_PUMA"]`
  (`:38`), and `pidfile` from `PIDFILE` (`:43`). `workers` is how a Rails app
  uses more than one core.
- trails serves through `http.createServer` in one process
  (`packages/rackup/lib/handler/node.ts:63`), so a trails app uses one core,
  and a crash takes the whole server down.
- `trails server` keeps Rails' Puma checks (`packages/trailties/lib/commands/server.ts:134,167,192`,
  from `server_command.rb:87-100`), which answer "not Puma" for every trails app.
- Solid Queue's Puma plugin (`vendor/solid_queue/v1.7.2/lib/puma/plugin/solid_queue.rb`,
  147 lines) is how the Rails template runs jobs without a second process.

## Design

### Shape

| Puma (Rails app)                         | trails                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP server                              | rackup `Handler::Node` (`node:http`), unchanged                                                                                                                        |
| `workers N`                              | with `workers > 1`, `trails server` is a `node:cluster` primary that forks N workers, each running the Rack app on the shared socket, and re-forks a worker that exits |
| `workers 0/1`                            | one process, today's behavior; the development default                                                                                                                 |
| `threads min, max`                       | no threads. `TRAILS_MAX_THREADS` stays the env var the database pool reads, meaning concurrent connections per worker                                                  |
| `SIGUSR2` / `SIGUSR1`                    | full restart / rolling restart (replace workers one at a time)                                                                                                         |
| `plugin :tmp_restart`                    | the primary watches `tmp/restart.txt` and does a rolling restart                                                                                                       |
| `plugin :solid_queue`                    | the primary starts and supervises the Solid Queue supervisor, as the plugin's fork mode does                                                                           |
| `pidfile`, `port`, `bind`, `environment` | config the primary reads                                                                                                                                               |

### `config/puma.ts`

The generated file mirrors `puma.rb.tt` line for line in a small DSL on the
config's receiver (`threads`, `port`, `plugin`, `pidfile`, `workers`), so a
Rails developer reads it as the same file. It configures trails' cluster, not
Puma; that is receipted once on the DSL's class.

### Where the code lives

The cluster primary and DSL in `rackup` (next to `Handler::Node`), the command
and template in `trailties`, and the plugin in `solid-queue` as a port of
`lib/puma/plugin/solid_queue.rb` onto the primary's plugin hook. There is no
`@blazetrails/puma`, because no Puma code is ported.

## Non-goals

- **Porting Puma.** It is a separate C-extension server; `node:http` already
  does its job.
- **`preload_app!`.** Node has no copy-on-write `fork` (root CLAUDE.md
  § "Runtime facts Node does not expose").
- **TLS binds, worker timeouts, memory killers.** TLS terminates at a proxy;
  the others are post-v1.
- **PM2 or another process manager.** `node:cluster` is built in.

## Alternatives considered

- **`config/server.ts` as a plain object.** Honest about what runs, but a Rails
  developer looking for `puma.rb` does not find it. Open question 1.
- **Leave Puma permanent forever.** Rejected: one core per app is not a
  production server.
- **Run workers as threads (`worker_threads`).** Rejected: a Rack app's
  module-level state is per process in Rails' model, and a crash in one thread
  takes the process down.

## Rollout

1. `cluster-primary-and-workers` (fork, supervise, signals).
2. `puma-config-dsl-and-generator`, `tmp-restart-plugin`.
3. `solid-queue-plugin-in-server`.
4. `trails-server-uses-cluster`: `Server::Command` drops its Puma checks,
   reads `config/puma.ts`, and starts the primary.

## Verification

- A generated app with `WEB_CONCURRENCY=4` serves from 4 worker pids on one
  port; killing one is followed by a replacement and no failed request.
- `SIGUSR1` replaces every worker with no failed request; touching
  `tmp/restart.txt` does the same.
- With `SOLID_QUEUE_IN_PUMA=1`, a job enqueued by a request runs with no
  second command.

## Open questions

1. **`config/puma.ts` or `config/server.ts`?** Recommendation: `config/puma.ts`,
   since trails maps by Rails concept and the Rails concept is Puma's config.
2. **Pool sizing.** Recommendation: keep `TRAILS_MAX_THREADS` as the variable
   the generated database config reads for `pool`, documented as concurrent
   connections per worker.
3. **Worker count variable.** Recommendation: `WEB_CONCURRENCY`, as Puma and
   Heroku-style hosts read it.
