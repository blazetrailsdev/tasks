---
title: "Port AssetUrlHelper video/audio/font *_path and *_url with their aliases"
status: claimed
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-09-28T11:37:49Z"
assignee: "asset-url-helper-video-audio-font-path-and-url"
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-rest-of-asset-tag-helper-and-asset-url-helper`. That PR ported
`asset_url`/`url_to_asset`, `javascript_path`/`_url`, `stylesheet_url` and
`image_url` (plus their aliases) into
`packages/actionview/src/helpers/asset-url-helper.ts`, following the existing
`stylesheetPath` / `pathToStylesheet` shape (`function` + `export const alias = fn`).

Still missing, `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_url_helper.rb`:

- `video_path` / `path_to_video` (`:404-407`), `video_url` / `url_to_video` (`:416-419`)
- `audio_path` / `path_to_audio` (`:430-433`), `audio_url` / `url_to_audio` (`:442-445`)
- `font_path` / `path_to_font` (`:455-458`), `font_url` / `url_to_font` (`:467-470`)

Each is `path_to_asset(source, { type: :x }.merge!(options))` or
`url_to_asset(...)`; `ASSET_PUBLIC_DIRECTORIES` already carries `/videos`,
`/audios`, `/fonts`.

Tests, `vendor/rails/v8.0.2/actionview/test/template/asset_tag_helper_test.rb`:
tables `VideoPathToTag`..`UrlToVideoToTag` (`:335-362`), `AudioPathToTag`..
`UrlToAudioToTag` (`:389-416`), `FontPathToTag`/`FontUrlToTag`/`UrlToFontToTag`
(`:427-450`); tests `test_video_path`..`test_url_to_font_alias_for_font_url`
(`:817-867`). The `table()` / `media()` / `urls()` builders in
`packages/actionview/src/template/asset-tag-helper.test.ts` already generate
these shapes.

## Acceptance criteria

- The twelve functions exist in Rails source order after `imageUrl`, exported from `helpers/index.ts`.
- The 11 Rails tests above are enrolled under their verbatim names; `asset_tag_helper_test.rb` climbs by 11.
