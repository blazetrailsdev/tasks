---
title: "Port ViteRuby::CLI and its commands, and the bin/vite binstub"
status: draft
updated: 2026-11-12
rfc: "0000-vite-assets-port"
cluster: vite-assets
packages: [vite-assets]
deps: [vite-assets-builder-commands-runner]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:7-30` registers
`build`, `clobber`, `dev`, `install`, `ssr`, `version`, `upgrade` and
`upgrade_packages`. They are implemented in `cli/*.rb`, and
`cli/install.rb:6-146` is the largest. `exe/vite` is the binstub. The CLI is
built on `dry-cli` (`vite_ruby.gemspec:22`). trails expresses it on
`@blazetrails/thor` instead (hotwire-via-vite open question 4, resolved). The rake
tasks belong to `vite-assets-rake-tasks`. Tests:
`vendor/vite_ruby/v3.11.1/test/file_utils_test.rb` and `upgrade_test.rb`.

## Acceptance criteria

- `ViteRuby::CLI` is a Thor class on `@blazetrails/thor`, and each
  `ViteRuby::CLI::*` command keeps its Rails class name and its `call` body,
  ported unchanged. dry-cli's `desc` / `option` / `argument` map onto Thor's
  `desc` / `method_option` / arguments. The base class and DSL carry one
  receipt citing the ratified section.
- `bin/vite <command> --help` lists the same commands and options as
  upstream's `cli.rb:7-30`.
- `cli/install.rb`'s package-manager detection is ported as written. A
  generated trails app is a pnpm project, so it resolves to pnpm there. The
  turbo and stimulus install templates hard-code `pnpm add` and do not call
  this detection, per the ruling.
- `bin/vite` in a generated app runs `ViteRuby::CLI`.
- `file_utils_test.rb` and `upgrade_test.rb` are ported under their upstream
  names.
