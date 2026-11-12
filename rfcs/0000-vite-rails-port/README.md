---
rfc: "0000-vite-rails-port"
title: "Port the vite_rails gem"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "vite-rails"
clusters:
  - vite-rails
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Port the vite_rails gem

## Summary

Port `vite_rails` (same tag as vite_ruby) as `@blazetrails/vite-rails`. It
provides the Engine, `ViteRails::TagHelpers`, `ViteRails::CLI` (the Rails
`vite:install`) and the `assets:precompile` hook. Part of the `hotwire-via-vite` meta RFC.

## Motivation

These are the tag helpers (`vite_javascript_tag`, `vite_client_tag`, and the
rest) that a generated app's layout calls, and the Engine initializers that
install them through `on_load(:action_view)`. Measured: 5 `.rb` files plus
rake, 272 LOC, 14 public and 3 internal methods, and about 20 upstream tests
(`helper_test.rb`, `engine_rake_tasks_test.rb`).

## Design

`packages/vite-rails/lib/` mirrors `vite_rails/lib/vite_rails/`. The
helpers call actionview's own `javascript_include_tag`,
`stylesheet_link_tag` and `image_tag`, and never override them. actionview
stays pipeline-agnostic (meta RFC ruling). The `vite_rails.proxy`
initializer is wired into the middleware stack by the meta RFC's
`vite-rails-dev-server-topology` story, which also changes `trails server`.

## Non-goals

- **Spring.** `engine.rb:26-34` watches through Spring, which trails does not
  have. That arm is dropped with a `PERMANENT-SKIP` receipt.
- **vite_rails_legacy.** It targets legacy browsers.

## Alternatives considered

- **Put the tag helpers in actionview.** This breaks Rails'
  pipeline-agnostic `AssetUrlHelper`. Rejected by the meta RFC's boundaries
  ruling.

## Rollout

1. `vite-rails-package-and-tag-helpers`.
2. `vite-rails-install-and-precompile-hook`.

## Verification

- `pnpm parity:api vite-rails` reaches 14 public methods.
- `parity:test` total = matched + `PERMANENT-SKIP`, where the total is the
  exact count `vite-rails-package-and-tag-helpers` records. The only allowed
  skip reason is the Spring arm.

## Open questions

None.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
