---
title: "Create @blazetrails/vite-trails: Engine and ViteTrails::TagHelpers"
status: draft
updated: 2026-11-12
rfc: "0000-vite-trails-port"
cluster: vite-trails
packages: [vite-trails]
deps: [vite-assets-core-package]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/tag_helpers.rb:6-116` covers
`vite_client_tag` (`:6`), `vite_react_refresh_tag` (`:13`),
`vite_asset_path` (`:25`), `vite_asset_url` (`:33`), `vite_javascript_tag`
(`:38`), `vite_typescript_tag` (`:58`), `vite_stylesheet_tag` (`:63`),
`vite_image_tag` (`:72`), `vite_picture_tag` (`:83`), and the private
`vite_manifest` (`:98`) and `vite_preload_tag` (`:103`).

`engine.rb:5-41` holds the initializers `vite_rails.helper`
(`on_load(:action_controller)` / `on_load(:action_view)`),
`vite_rails.logger`, `vite_rails.bootstrap` and `vite_rails.set_source`, which
this story ports. The `vite_rails.proxy` initializer (`:6-8`) is out of scope
here. `vite-trails-dev-server-topology` ports it and turns it on, because it
needs `DevServerProxy` from `vite-assets-dev-server-proxy`.
`config.rb:1-18` is `ViteRails::Config`. Tests: `vendor/vite_ruby/v3.11.1/test/helper_test.rb`
(17).

## Acceptance criteria

- `packages/vite-trails/lib/` mirrors `vite_rails/lib/vite_rails/`. TagHelpers
  is a module included onto `ActionView::Base` through `onLoad("action_view")`,
  as at `engine.rb:15-17`. The helpers call actionview's own
  `javascript_include_tag` / `stylesheet_link_tag` / `image_tag`, and do not
  override them.
- The Spring arm of `vite_trails.bootstrap` is dropped with a receipt citing
  the vite-trails-port non-goal.
- `helper_test.rb` is ported under its upstream names. `vite-trails` gets
  `compareApi: true` and `compareTests: true` in `vendor/sources.ts`.
