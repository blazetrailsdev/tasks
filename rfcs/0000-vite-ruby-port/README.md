---
rfc: "0000-vite-ruby-port"
title: "Port the vite_ruby gem"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "vite-ruby"
clusters:
  - vite-ruby
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Port the vite_ruby gem

## Summary

Port `vite_ruby` v3.11.1 (`vendor/vite_ruby/v3.11.1/vite_ruby/`) as
`@blazetrails/vite-ruby`. This is the framework-agnostic core: config,
manifest, builder, runner, the dev-server proxy, the `bin/vite` CLI and the
`vite:*` rake tasks. Part of the `hotwire-via-vite` meta RFC, whose ruling makes Vite the trails
JavaScript pipeline.

## Motivation

vite_rails is a thin layer over this gem, and every Vite-aware tag helper
resolves through `ViteRuby::Manifest`. Measured over the vendored tree: 24
`.rb` files plus rake, 1,728 LOC, 118 public and 72 internal methods, and
about 100 upstream tests in the monorepo's shared `test/` directory.

## Design

`packages/vite-ruby/lib/` mirrors `vite_ruby/lib/vite_ruby/`, with
`libEntryFile` `vite_ruby.rb`. `ViteRuby::Config` keeps its precedence
order: defaults, then `config/vite.json`, then `VITE_RUBY_*` env vars, then
explicit attrs. `DevServerProxy` subclasses `Rack::Proxy` from
`@blazetrails/rack-proxy` (`rack-proxy-port`). The CLI is built on
`@blazetrails/dry-cli` (`dry-cli-port`), depending on the meta RFC's open
question 4. The shared `test/` directory is split by assigning the
vite_ruby files to this package in `vendor/sources.ts`.

## Non-goals

- **`vite_hanami`, `vite_padrino`, `vite_plugin_legacy`.** These are other
  frameworks or legacy browsers (meta RFC non-goal).
- **The npm `vite` and `vite-plugin-ruby`.** These are dependencies, not ports.

## Alternatives considered

- **Merge vite_ruby into the vite-rails package.** That breaks the gem
  boundary that `parity:api` keys on. Rejected.

## Rollout

1. `vite-ruby-core-package` (Config, Manifest, errors).
2. `vite-ruby-builder-commands-runner` and `vite-ruby-dev-server-proxy`.
3. `vite-ruby-cli-and-binstub`, then `vite-ruby-rake-tasks`.

## Verification

- `pnpm parity:api vite-ruby` reaches 118 public methods.
- `parity:test` total = matched + `PERMANENT-SKIP`, where the total is the
  exact count `vite-ruby-core-package` records for the split `test/`
  directory. `PERMANENT-SKIP` is allowed only for the reasons the meta RFC
  lists.

## Open questions

None of its own. The CLI waits on the meta RFC's open question 4.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
