---
title: "Generators execute_command runs bin/<executor> through run inside in_root (actions.rb:461-472)"
status: draft
updated: 2026-10-15
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

`packages/trailties/src/generators/actions.ts#executeCommand` spawns the bare `executor` (`rake`), with env from `TRAILS_ENV`. Rails runs
`in_root { run("#{sudo}#{Shellwords.escape Gem.ruby} bin/#{executor} #{command}", config) }`, with
`config = { env: { "RAILS_ENV" => ... }, verbose: false, capture:, abort_on_failure: }`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:461-472`). The trails body differs in four ways:

- it calls `spawnSync` directly where Rails calls `run`, which is why it carries `@missingRailsCall run`;
- it does not wrap the call in `in_root`;
- it runs the bare executor, not the app's `bin/` binstub;
- it raises its own abort error.

This is also the blocker for porting `generate` -> `rails_command` (`actions.rb:332-339,391-403`), tracked in
`key-read-receiver-unread-port-body-rows-remainder`. Once the command runs through the app's binstub (`bin/trails`), the
authentication generator's migrations can be produced by a real spawned process in its tests.

## Acceptance criteria

- [ ] `executeCommand` is Rails' body: `log`, the `sudo` prefix, the `config` hash, and `inRoot` around `run` with `bin/<executor>`.
- [ ] The `@missingRailsCall run — PERMANENT` receipt is removed.
- [ ] The rake tests in `actions.test.ts` assert the binstub command line.
