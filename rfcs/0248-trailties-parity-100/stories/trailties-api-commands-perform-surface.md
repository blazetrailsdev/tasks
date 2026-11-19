---
title: "trailties: match the commands/* perform and constructor members"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: api-residuals
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api --missing` shows these command files at 0% (✗) or partial, with the
member missing from the TS command class:

- `commands/about/about_command.rb`: `perform`
- `commands/boot/boot_command.rb`: `perform`, `initialize`
- `commands/devcontainer/devcontainer_command.rb`: `perform`, `devcontainer_options`, `database`
- `commands/initializers/initializers_command.rb`: `perform`, `initialize`
- `commands/middleware/middleware_command.rb`: `perform`
- `commands/new/new_command.rb`: `help`, `perform`
- `commands/restart/restart_command.rb`: `perform`
- `commands/secret/secret_command.rb`: `perform`
- `commands/test/test_command.rb`: `models`, `helpers`, `channels`, `controllers`, `mailers`, `integration`, `jobs`, `mailboxes`

Check first whether each TS command defines the member under a different class
or file name; most of these are likely a placement or registration gap
(package CLAUDE.md § "Thor commands register through an explicit `methodAdded`").

## Acceptance criteria

- [ ] Every member listed above is matched in `pnpm parity:api -- --package trailties --missing`.
- [ ] Each new member follows the Rails body; deviations go through the root CLAUDE.md process.
