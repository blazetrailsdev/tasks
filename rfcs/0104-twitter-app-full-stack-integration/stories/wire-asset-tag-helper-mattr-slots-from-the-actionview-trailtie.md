---
title: "Wire AssetTagHelper's apply_stylesheet_media_default and preload_links_header from the ActionView trailtie"
status: in-progress
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 7503
claim: "2026-09-05T01:22:11Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

PR #7378 ported `AssetTagHelper`'s two `mattr_accessor` slots
(`actionview/lib/action_view/helpers/asset_tag_helper.rb:27-28`) as
`preloadLinksHeader` / `applyStylesheetMediaDefault` in
`packages/actionview/src/helpers/asset-tag-helper.ts`, with `setPreloadLinksHeader`
/ `setApplyStylesheetMediaDefault` writers. Nothing sets them, so both read `null`
and two branches of `stylesheet_link_tag` are dead:

- `asset_tag_helper.rb:205` — `use_preload_links_header` falls back to the mattr,
  so the `Link: rel=preload` header and `send_preload_links_header` never run.
- `asset_tag_helper.rb:230-232` — `apply_stylesheet_media_default` never applies
  `media="screen"`.

Rails wires both from the ActionView railtie:

- `actionview/lib/action_view/railtie.rb:15` seeds
  `config.action_view.apply_stylesheet_media_default = true`.
- `actionview/lib/action_view/railtie.rb:71`, inside `config.after_initialize`,
  assigns `ActionView::Helpers::AssetTagHelper.apply_stylesheet_media_default =
app.config.action_view.delete(:apply_stylesheet_media_default)`.

`packages/actionview/src/trailtie.ts` already carries the config slot
(`defaultActionViewConfig()` returns `applyStylesheetMediaDefault: true`) but no
initializer consuming it, and its header comment still lists the AssetTagHelper
`after_initialize` block among the skipped ones "because the matching helper
setters either don't exist yet" — a reason that is now stale, since PR #7378
added the setters.

Note `asset-tag-helper-preload-links-header` (same RFC) is an unbodied stub
covering the preload half from the other direction; triage should merge the two
rather than ship both.

## Acceptance criteria

- The ActionView trailtie ports `railtie.rb:71`'s `after_initialize` assignment
  for `apply_stylesheet_media_default` (and `preload_links_header` if the sibling
  story has not taken it), reading the `actionView` config slot.
- The stale "setters don't exist yet" sentence in
  `packages/actionview/src/trailtie.ts`'s header comment is corrected.
- A test asserts a booted app's `stylesheet_link_tag` emits `media="screen"`
  under the default config, mirroring the Rails behaviour the slot controls.
