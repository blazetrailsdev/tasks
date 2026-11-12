---
title: "Port ViteRuby::CLI and its commands, and the bin/vite binstub"
status: draft
updated: 2026-11-12
rfc: "0000-vite-ruby-port"
cluster: vite-ruby
packages: [vite-ruby]
deps: [vite-ruby-builder-commands-runner, dry-cli-gem-port]
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
built on `dry-cli` (`vite_ruby.gemspec:22`, hotwire-via-vite open question 4). The rake
tasks belong to `vite-ruby-rake-tasks`. Tests:
`vendor/vite_ruby/v3.11.1/test/file_utils_test.rb` and `upgrade_test.rb`.

## Acceptance criteria

- Every `ViteRuby::CLI::*` command is a `Dry::CLI::Command` subclass on
  `@blazetrails/dry-cli`, ported under its Rails name. If the operator picks
  Thor instead, the `dry-cli-gem-port` dep is dropped and this story records
  the receipt.
- `cli/install.rb`'s package-manager detection is ported as written. A
  generated trails app is a pnpm project, so it resolves to pnpm there.
- `bin/vite` in a generated app runs `ViteRuby::CLI`.
- `file_utils_test.rb` and `upgrade_test.rb` are ported under their upstream
  names.
