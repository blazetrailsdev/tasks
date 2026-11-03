---
title: "server-start-after-stop-callback-and-trap"
status: in-progress
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9673
claim: "2026-11-03T16:04:44Z"
assignee: "constant-residue-excluded-other-packages-receipts"
blocked-by: null
closed-reason: null
---

## Context

trails#9558 ported `Server#start(afterStopCallback)` (run on the listening server's `close`) and `perform`'s `after_stop_callback` lambda (`packages/trailties/src/commands/server.ts:78-98`, `:290-293`). Two Rails calls are still missing:

- `trap(:INT) { exit }` in `Server#start` (`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:32-41`).
- `set_application_directory!` in `ServerCommand#perform` (`:133`, `vendor/rails/v8.0.2/railties/lib/rails/command/actions.rb`). `perform` instead does `Dir.chdir(Trails.root()!)` after `requireApplicationBang`, and carries `@missingRailsCall application — CONVERGEABLE server-start-after-stop-callback-and-trap` (`server.ts:280`).

## Acceptance criteria

- [ ] `Server#start` traps INT and exits, as Rails does.
- [ ] `perform` calls `setApplicationDirectoryBang` at Rails' position, the invented `Dir.chdir` goes, and the receipt naming this story is removed.
