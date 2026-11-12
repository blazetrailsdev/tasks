---
title: "Port the dry-cli gem as @blazetrails/dry-cli"
status: draft
updated: 2026-11-12
rfc: "0000-dry-cli-port"
cluster: dry-cli
packages: [dry-cli]
deps: [hotwire-vite-claude-md-ruling]
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

`ViteRuby::CLI` does `extend Dry::CLI::Registry`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:7-18`), and every
`ViteRuby::CLI::*` command subclasses `Dry::CLI::Command`
(`cli/install.rb:6`). `vite_ruby.gemspec:22` depends on `dry-cli`. No trails
package ports it, and `vendor/sources.ts` does not vendor it. This story is
option (a) of hotwire-via-vite open question 4, and it depends on the ruling story, where
the operator picks. If the operator picks option (b) (Thor), close it as
`wontfix` and drop it from `vite-ruby-cli-and-binstub`'s deps.

## Acceptance criteria

- `vendor/sources.ts` vendors `dry-rb/dry-cli` at `v1.4.1` (rubygems.org
  latest on 2026-11-12). If it is outside the `vite_ruby.gemspec:22` range,
  pin the newest version inside the range instead and record why. Record the
  SHA in `sources.lock.json`.
- `packages/dry-cli` mirrors `lib/dry/cli/`: `Dry::CLI` (`call`), `Registry`
  (`register`, `before`, `after`), `Command` (`desc`, `argument`, `option`,
  `example`) and the parser and usage/banner modules those call.
- `compareApi` and `compareTests` are on. The gem's specs for the ported files
  are ported under their upstream names. Files vite_ruby does not reach
  (inline commands, the shell completion extension) stay as unported rows
  with a reason.

## Verification

- `pnpm parity:api dry-cli` reports no missing methods in the ported files.
