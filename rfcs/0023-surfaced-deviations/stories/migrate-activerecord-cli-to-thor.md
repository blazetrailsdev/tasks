---
title: "activerecord-cli's ar dispatches through Thor"
status: draft
updated: 2026-11-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 800
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord-cli/lib/cli.ts` was a hand-rolled `if (command === …)` argv
switch, with its own flag parsing and HELP strings. Every other trails CLI
(`SolidQueue::Cli`, `Rails::Command::Base`) is a `Thor` subclass. Rails'
`Rails::Command::Base.perform` (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:67-74`)
turns `cmd --help` into `help cmd`, and `exit_on_failure?` is false (`base.rb:23-25`).

## Acceptance criteria

- `Cli extends Thor` registers one command per `ar` subcommand through `desc` /
  `longDesc` / `methodOption` / `methodAdded`. `map()` keeps the colon spellings.
- `cwd` reaches commands as Thor::Actions' `destinationRoot`.
- `ar <cmd> --help` routes to Thor help. Wrapper commands (`typecheck`,
  `models:dump`) are `stop_on_unknown_option!`.
- The existing activerecord-cli tests pass, and no test is renamed.
