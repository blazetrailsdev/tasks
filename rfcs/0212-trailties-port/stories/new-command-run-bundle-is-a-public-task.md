---
title: "new-command-run-bundle-is-a-public-task"
status: ready
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

`packages/trailties/src/commands/new.ts` keeps `NewAppGenerator`, which captures the generator instance only so the command can run the package-manager install after `AppGenerator.start`. Rails runs it inside the generator: `public_task :run_bundle` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:571`) over `run_bundle` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:705-707`). trails#9597 moved the `git init` half out. Generator tests calling `invokeAll` need `skipBundle`, as Rails' tests pass `--skip-bundle`.

## Acceptance criteria

- `run_bundle` is a registered task on `AppGenerator`, installing through `packageManagerInstall`.
- `NewAppGenerator`'s instance capture leaves `new.ts`, with its `@noRailsEquivalent` receipt.
