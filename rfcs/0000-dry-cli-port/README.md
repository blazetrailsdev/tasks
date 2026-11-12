---
rfc: "0000-dry-cli-port"
title: "Port the dry-cli gem"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "dry-cli"
clusters:
  - dry-cli
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Port the dry-cli gem

## Summary

Port the subset of `dry-cli` that vite_ruby uses (`Dry::CLI`, `Registry`,
`Command`, the parser and usage banner) as `@blazetrails/dry-cli`. Part of
the `hotwire-via-vite` meta RFC. This RFC exists only if the operator picks option (a) for that RFC's
open question 4.

## Motivation

`ViteRuby::CLI` does `extend Dry::CLI::Registry`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:7-18`), and every
`ViteRuby::CLI::*` command subclasses `Dry::CLI::Command` (`cli/install.rb:6`).
`vite_ruby.gemspec:22` depends on `dry-cli`. No trails package ports it.

## Design

`packages/dry-cli` mirrors `lib/dry/cli/`. The gem is vendored at `v1.4.1`,
the latest on rubygems.org on 2026-11-12, or at the newest version inside
`vite_ruby.gemspec:22`'s range if 1.4.1 falls outside it. Files vite_ruby
never reaches (inline commands, the shell-completion extension) stay as
unported rows, each with a reason.

## Non-goals

- **dry-cli's inline-command DSL and shell completion.** vite_ruby does not
  use them.

## Alternatives considered

- **Express `ViteRuby::CLI` as Thor commands.** trails already ports Thor, but
  this rewrites the gem's decomposition. It is option (b) of the meta RFC's
  open question 4. If the operator picks it, this RFC's story is closed as
  `wontfix` and this RFC is withdrawn.

## Rollout

1. `dry-cli-gem-port`. It depends on the ruling story, so it waits for the
   operator's choice.

## Verification

- `pnpm parity:api dry-cli` reports no missing methods in the ported files,
  and the specs for those files pass under their upstream names.

## Open questions

None of its own. It depends on the meta RFC's open question 4.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
