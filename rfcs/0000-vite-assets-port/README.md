---
rfc: "0000-vite-assets-port"
title: "Port the vite_ruby gem as @blazetrails/vite-assets"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "vite-assets"
clusters:
  - vite-assets
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Port the vite_ruby gem as @blazetrails/vite-assets

## Summary

Port `vite_ruby` v3.11.1 (`vendor/vite_ruby/v3.11.1/vite_ruby/`) as
`@blazetrails/vite-assets`. This is the framework-agnostic core: config,
manifest, builder, runner, the dev-server proxy, the `bin/vite` CLI and the
`vite:*` rake tasks. Part of the `hotwire-via-vite` meta RFC, whose ruling makes Vite the trails
JavaScript pipeline.

## Motivation

vite_rails is a thin layer over this gem, and every Vite-aware tag helper
resolves through `ViteRuby::Manifest`. Measured over the vendored tree: 24
`.rb` files plus rake, 1,728 LOC, 118 public and 72 internal methods, and
about 100 upstream tests in the monorepo's shared `test/` directory.

## Design

### Name

The package is `@blazetrails/vite-assets`, not `vite-ruby`. trails drops a
gem's "ruby" suffix (`bcrypt-ruby` is `@blazetrails/bcrypt`, `msgpack-ruby` is
`@blazetrails/msgpack`), and `vendor/sources.ts` keeps the gem mapping, so
`parity:api` still keys on `vite_ruby`. "assets" names the package by its
role, which is serving the app's browser JS/CSS. That keeps it distinct from
trails' other uses of Vite (vitest, trailties' test-only `trailsPlugin`, the
website build), none of which may import it. The Ruby class names stay
faithful (`ViteRuby`, `ViteRuby::Config`), as with every port.

### Layout

`packages/vite-assets/lib/` mirrors `vite_ruby/lib/vite_ruby/`, with
`libEntryFile` `vite_ruby.rb`. `ViteRuby::Config` keeps its precedence
order: defaults, then `config/vite.json`, then `VITE_RUBY_*` env vars, then
explicit attrs. `DevServerProxy` subclasses `Rack::Proxy` from
`@blazetrails/rack-proxy` (`rack-proxy-port`). The CLI is
built on `@blazetrails/thor` instead of dry-cli (meta RFC open question 4).
Command class names and `call` bodies are unchanged. The shared `test/` directory is split by assigning the
vite_ruby files to this package in `vendor/sources.ts`.

## Non-goals

- **`vite_hanami`, `vite_padrino`, `vite_plugin_legacy`.** These are other
  frameworks or legacy browsers (meta RFC non-goal).
- **The npm `vite` and `vite-plugin-ruby`.** These are dependencies, not ports.

## Alternatives considered

- **Port dry-cli for `bin/vite`.** vite_ruby uses only its registry and option
  DSL, and trails already runs its CLI on Thor. Rejected by the operator on
  2026-11-12 (meta RFC open question 4).

- **Name it `@blazetrails/vite-ruby`.** "ruby" is meaningless in a TypeScript
  package. Rejected by the operator on 2026-11-12.
- **Name it `@blazetrails/vite`.** This reads as trails' general Vite
  integration, and is easy to confuse with the npm `vite` in imports.
  Rejected.

- **Merge vite_ruby into the vite-rails package.** That breaks the gem
  boundary that `parity:api` keys on. Rejected.

## Rollout

1. `vite-assets-core-package` (Config, Manifest, errors).
2. `vite-assets-builder-commands-runner` and `vite-assets-dev-server-proxy`.
3. `vite-assets-cli-and-binstub`, then `vite-assets-rake-tasks`.

## Verification

- `pnpm parity:api vite-assets` reaches 118 public methods.
- `parity:test` total = matched + `PERMANENT-SKIP`, where the total is the
  exact count `vite-assets-core-package` records for the split `test/`
  directory. `PERMANENT-SKIP` is allowed only for the reasons the meta RFC
  lists.

## Open questions

None.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
