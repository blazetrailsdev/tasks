---
title: "server-start-after-stop-callback-and-trap"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

## Context

`ServerCommand#perform` and `Rails::Server#start` (`packages/trailties/src/commands/server.ts`) omit three Rails calls.

- `trap(:INT) { exit }` and the `ensure after_stop_callback.call` in `Server#start` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:32-41`). Rack's `super()` blocks in Ruby; `Handler.Node.run` resolves once bound, so an `ensure` would fire at boot, not at stop.
- `after_stop_callback = -> { say "Exiting" unless options[:daemon] }` (`:144`).
- `set_application_directory!` (`:133`, `rails/command/actions.rb`), which needs `Rails::Command.root` semantics for a built app.

`--daemon`, `--pid` writing, `--restart` and `--early-hints` are parsed but have no serving effect, since `Rackup::Server` is unported.

## Acceptance criteria

- [ ] `Server#start` runs its after-stop callback when the listening server closes, and traps INT.
- [ ] `perform` calls `setApplicationDirectoryBang`, and the receipts naming this story are gone.
