---
title: "Port Rails::Generators::Base banner / desc / help over Thor::Group's help, and route `trails g <name> --help` through it"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "rebase-generator-base-onto-thor-group",
    "port-generate-and-destroy-commands-onto-rails-command-base",
    "thor-cli-names-are-kebab-case-accept-snake-case-input",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Group.dispatch` (thor 1.3.2 `lib/thor/group.rb:227-244`, installed gem, not
vendored) starts with
`if Thor::HELP_MAPPINGS.include?(given_args.first); help(config[:shell]); return; end`.
`HELP_MAPPINGS` is `%w(-h -? --help -D)` (`thor/base.rb:17`). `Thor::Group.help`
(`group.rb:29-35`) prints `Usage:`, `banner`, `class_options_help` and `desc`.

trails#8228 ported `Thor::Group.dispatch` as the private `GeneratorBase.dispatch`
(`packages/trailties/src/generators/base.ts`) without this arm. Porting `help` faithfully
needs Rails' generator `banner` (`railties/lib/rails/generators/base.rb`, `self.banner`,
which reads Thor `arguments`) and `desc` (`base.rb`, which reads `usage_path` / the USAGE
templates). trails has neither Thor `argument` declarations nor USAGE files. Today,
`trails generate <name> --help` is answered by commander's `addHelpText` in
`packages/trailties/src/commands/generate.ts`, so the dispatch arm is reachable only through
`Generators.invoke(ns, ["--help"], …)`.

Generator names follow RFC 0171 decision 6 ("Command and generator names are kebab-case on the command line", `thor-cli-names-are-kebab-case-accept-snake-case-input`): the `trails g` listing (`sorted_groups` / `print_list`, `generators.rb:196-232,285-289`) and `CorrectableNameError` suggestions show `scaffold-controller`, not `scaffold_controller`.

## Acceptance criteria

- `GeneratorBase.banner` / `desc` / `help` are ported from `generators/base.rb` and Thor's
  `group.rb:29-35`, and `dispatch` gains the `HELP_MAPPINGS` arm.
- `commands/generate.ts` routes `--help` through that arm instead of `addHelpText`.
- [ ] `trails g --help` and `trails g <name> --help` show generator names in kebab-case, and a ported assertion on snake_case listing text asserts the kebab spelling, with an `assertion-receipts.ts` row citing RFC 0171 decision 6.

## Thor port (the Thor-port RFC this story is rehomed into)

The `HELP_MAPPINGS` arm itself comes with `Thor::Group.dispatch` (`port-thor-group`) once `rebase-generator-base-onto-thor-group` lands. What remains is Rails' generator `banner` / `desc` (`usage_path`, the USAGE files rendered through TSE) and `commands/generate.ts` routing `--help` through the arm instead of commander's `addHelpText`. Estimated at 350.
