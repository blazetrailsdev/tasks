---
title: "asset-tag-helper-image-loading-and-decoding-mattrs"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`actionview/lib/action_view/railtie.rb:67-72` is one `config.after_initialize`
block assigning four `AssetTagHelper` mattrs:

```ruby
ActionView::Helpers::AssetTagHelper.image_loading = app.config.action_view.delete(:image_loading)
ActionView::Helpers::AssetTagHelper.image_decoding = app.config.action_view.delete(:image_decoding)
ActionView::Helpers::AssetTagHelper.preload_links_header = app.config.action_view.delete(:preload_links_header)
ActionView::Helpers::AssetTagHelper.apply_stylesheet_media_default = app.config.action_view.delete(:apply_stylesheet_media_default)
```

PR #7503 (`wire-asset-tag-helper-mattr-slots-from-the-actionview-trailtie`)
ported the block at `packages/trailties/src/trailties/action-view.ts`, but only
the last two lines: `image_loading` and `image_decoding` have no counterpart in
`packages/actionview/src/helpers/asset-tag-helper.ts`, which declares only
`preloadLinksHeader` and `applyStylesheetMediaDefault`
(`asset_tag_helper.rb:27-28` is `mattr_accessor :image_loading, :image_decoding,
:preload_links_header, :apply_stylesheet_media_default` — trails ported half the
list).

The trailtie already seeds both keys on the `actionView` config slot
(`action-view.ts`, `imageLoading: null` / `imageDecoding: null`, mirroring
`railtie.rb:14-15`), so the config half exists and only the helper half and the
two assignments are missing.

Downstream, `image_tag`'s `loading:`/`decoding:` defaults read those mattrs
(`asset_tag_helper.rb:305-318`), so the defaults are currently unreachable.

## Converged shape

- `imageLoading` / `imageDecoding` join `preloadLinksHeader` /
  `applyStylesheetMediaDefault` in `packages/actionview/src/helpers/asset-tag-helper.ts`,
  with `setImageLoading` / `setImageDecoding` writers (the settled trails idiom
  for a Ruby `x=` that cannot be a TS `set` accessor).
- The two missing lines are added to the `after_initialize` block in
  `packages/trailties/src/trailties/action-view.ts`, in Rails' order — image
  first, then decoding, then the two already ported.
- `image_tag` reads them where `asset_tag_helper.rb:305-318` does.

## Acceptance criteria

- [ ] All four lines of `railtie.rb:67-72`'s block are ported.
- [ ] A test asserts a booted app's `image_tag` honours a configured
      `config.action_view.image_loading`.
- [ ] `pnpm parity:api:extra --package actionview` does not increase.
