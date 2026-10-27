---
title: "trails-server-runs-and-awaits-server-blocks"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# trails server runs server blocks, and awaits them

## Context

Rails runs `server` blocks when a server boots: `config.ru` calls
`Rails.application.load_server` (`railties/lib/rails/engine.rb:485-488`),
which calls `run_server_blocks`. `Rails::Application#run_server_blocks`
(`railties/lib/rails/application.rb:586-589`) runs every railtie's blocks and
then its own; `Rails::Application#server` (`application.rb:383-385`) lets an
initializer write `Rails.application.server { ... }`.

In trails:

- `trails server` (`packages/trailties/src/commands/server.ts`) calls
  `Trails.initialize()` and serves. It never loads `config.ts`, the only caller
  of `loadServer()`, so no server block ever runs under `trails server`.
- `Engine#loadServer` and `Trailtie#runServerBlocks` are synchronous. A block
  that does I/O returns a promise nobody awaits: the server binds before the
  block finishes, and its rejection is unhandled.
- `Application` has no `runServerBlocks` override and no instance `server`.

This is what pushes boot-time checks into initializers. trailmap's
database-presence check lives in `config/initializers/`, and since
trails#9284 `trails-tsc-views build` loads every initializer, so building
views needs both live databases (trailmap#83 CI).

## Acceptance criteria

- `Trailtie#runServerBlocks` and `Engine#loadServer` await each block in
  registration order; a block may return a promise.
- `Application#runServerBlocks` runs each railtie's blocks, then its own;
  `Application#server` delegates to the class.
- `trails server` awaits `app.loadServer()` before binding, so a rejecting
  block fails the boot.
- Tests for each, in `trailtie.test.ts`, `engine.test.ts`,
  `application.test.ts` and `commands/server.trails.test.ts`.
