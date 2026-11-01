---
title: "class-paths-table-covers-rails-command"
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

`packages/trailties/src/class-paths.generated.ts` has no `Rails::Command::*` row and `pnpm parity:class-paths` adds none, so `CorrectableNameError#detailed_message` ends `(CorrectableNameError)` where Rails prints `(Rails::Command::CorrectableNameError)` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:17`).

## Acceptance criteria

- [ ] The generated table holds the `Rails::Command::*` classes.
- [ ] `test_using_server_mistype` in `packages/trailties/src/commands/server.test.ts` asserts the full Ruby path.
