---
title: "vendor-thor-and-port-command-base-thor-surface"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
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

`Rails::Command::Base < Thor` (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:14`)
inherits its option and dispatch machinery from the thor gem, which is not vendored under
`vendor/`. trails#8247 therefore stands in for Thor's API on
`packages/trailties/src/command/base.ts` with receipts pointing here:

- `classOption` / `classOptions`: Thor::Base::ClassMethods#class_option / #class_options,
  used by `unused_routes_command.rb:9-10`
- `dispatch`: Thor.dispatch, called by `base.rb:73`. The trails one takes option values that
  Commander has already parsed (through `config.options`) instead of splitting and parsing
  `given_args` with `Thor::Options`
- `help`: Thor#help (instance), reached by `base.rb:68-71`'s HELP_MAPPINGS arm. Its output
  format is approximated from `classOptions()`
- `say`: Thor::Shell::Basic#say (`quiet?`, newline only when the message does not end in
  whitespace)

`generators/base.ts`'s `classOption` / `classOptions` / `classOptionsHelp` are the same
Thor surface on the generator side.

## Acceptance criteria

- thor (the version railties 8.0.2's gemspec pins) is vendored under `vendor/` with a
  `vendor/README.md` entry.
- The members above are ported from the vendored `thor/base.rb`, `thor.rb` and
  `thor/shell/basic.rb` with Thor's names and control flow, and their
  `@noRailsEquivalent CONVERGEABLE` receipts are removed.
