---
title: "Generator rake/trails_command dispatch execute_command on self (actions.rb:364-402)"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' generator actions dispatch through `self`:

- `rake` is `execute_command :rake, command, options` (`vendor/rails/v8.0.5.2/railties/lib/rails/generators/actions.rb:364-366`).
- `rails_command`'s non-inline arm is `execute_command :rails, command, options` (`:400-402`).

So a stubbed or overridden `execute_command` on a generator instance is honoured, as in `authentication_generator_test.rb`'s `generator.stub(:bundle_command, …)` pattern.

trails' `packages/trailties/lib/generators/actions.ts` calls the module-local function instead: `rake` uses `executeCommand.call(this, "rake", …)` and `trailsCommand` uses `executeCommand.call(this, "trails", …)`. An instance override of `executeCommand` (the `Base#executeCommand` field, `base.ts:304`) is skipped. trails#10588 converged `generate` the same way (`this.trailsCommand(...)`, mirroring `actions.rb:338`).

## Acceptance criteria

- [ ] `rake` calls `this.executeCommand("rake", command, options)`, and `trailsCommand`'s non-inline arm calls `this.executeCommand("trails", command, options)`.
- [ ] `ActionsHost` declares `executeCommand`.
- [ ] A test overrides `executeCommand` on a generator instance and sees `rake` and `trailsCommand` dispatch to it.
