---
title: "Rebase Rails::Command::Base onto the Thor port (Base < Thor, Error < Thor::Error, Behavior's Thor::Base.shell) and delete its stand-ins"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-dispatch-and-help",
    "port-thor-invocation",
    "port-thor-shell-module-basic-output-and-terminal",
    "thor-command-registration-lint-rule",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Base < Thor` (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:14`),
with `class Error < Thor::Error` (`:15`), and `Rails::Command::Behavior` sets
`Thor::Base.shell = Thor::Shell::Basic` (`command/behavior.rb:13`). trails#8247 stood in for
Thor on `packages/trailties/src/command/base.ts`, with receipts pointing here:

- `classOption` / `classOptions`: `Thor::Base::ClassMethods#class_option` / `#class_options`,
  used by `unused_routes_command.rb:9-10`;
- `dispatch`: `Thor.dispatch`, called by `base.rb:73`. The trails one takes option values that
  commander has already parsed (through `config.options`), instead of splitting and parsing
  `given_args` with `Thor::Options`;
- `help`: `Thor#help` (instance), reached by `base.rb:68-71`'s `HELP_MAPPINGS` arm. Its output
  format is approximated from `classOptions()`;
- `say`: `Thor::Shell::Basic#say`.

Thor itself was vendored by trails#8269 (`vendor/thor/v1.3.2`).

## Acceptance criteria

- [ ] `class Base extends Thor`. `classOption` / `classOptions` / `dispatch` / `help` / `say`
      are deleted from `command/base.ts` and their `@noRailsEquivalent CONVERGEABLE` receipts go
      with them. `perform` (`base.rb:66-74`) calls Thor's `dispatch`.
- [ ] `Rails::Command::Base::Error < Thor::Error`, and `Behavior` sets `Thor::Base.shell`.
- [ ] `UnusedRoutesCommand` declares its options through Thor's `class_option`, and its
      `help` output is Thor's.
