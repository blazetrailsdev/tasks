---
title: "generators-load-rails-command-for-inline-rails-command"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
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

`railsCommand` (`packages/trailties/src/generators/actions.ts`) reads `Trails.Command!`, seated at the foot of `packages/trailties/src/command.ts`, which only the CLI entries load. Rails' `vendor/rails/v8.0.2/railties/lib/rails/generators.rb:4` is `require "rails/command"`, so `rails_command ..., inline: true` always resolves. A static import is not possible: `server/entry-point.test.ts` forbids commander in the production graph through `generators/actions.ts`.

## Acceptance criteria

- A generator run outside the CLI with `inline: true` reaches `Command.invoke`, with the production entry-point graph still free of commander.
