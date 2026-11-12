---
title: "Port ViteRuby::CLI, bin/vite and the vite:* rake tasks"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: vite
packages: [vite-ruby]
deps: [vite-ruby-builder-commands-runner, dry-cli-gem-port]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:7-30` registers `build`, `clobber`,
`dev`, `install`, `ssr`, `version`, `upgrade` and `upgrade_packages`. These
are implemented in `cli/*.rb`, with `cli/install.rb:6-146` the largest.
`exe/vite` is the binstub. `lib/tasks/vite.rake:7-95` defines
`vite:binstubs`, `build`, `build_ssr`, `build_all`, `clobber`,
`verify_install`, `install_dependencies` and `info`, and enhances
`assets:precompile` at `:57-72`. The CLI is built on `dry-cli`
(`vite_ruby.gemspec:22`). RFC open question 4 decides how. Tests:
`vendor/vite_ruby/v3.11.1/test/file_utils_test.rb`, `rake_tasks_test.rb` and `upgrade_test.rb`.

## Acceptance criteria

- The commands are `Dry::CLI::Command` subclasses on `@blazetrails/dry-cli`
  (`dry-cli-gem-port`, RFC open question 4). If the operator picks Thor
  instead, that dep is dropped and this story records the receipt.
- Every command class and rake task is ported under its Rails name. The
  `vite.rake` tasks register through `@blazetrails/rake`.
- `bin/vite` in a generated app runs `ViteRuby::CLI`.
