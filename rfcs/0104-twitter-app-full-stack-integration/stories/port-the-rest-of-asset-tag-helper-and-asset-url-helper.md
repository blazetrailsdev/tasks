---
title: "Port the rest of AssetTagHelper and AssetUrlHelper (5 of 114 Rails tests match today)"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7378 ported only the stylesheet path through `AssetTagHelper` /
`AssetUrlHelper`, because that is what the generated layout needed. The two
modules are otherwise unported, and `parity:test` shows the cost directly:
`actionview/test/template/asset_tag_helper_test.rb` matches **5 of 114** tests
against `packages/actionview/src/template/asset-tag-helper.test.ts`.

Ported today (`packages/actionview/src/helpers/asset-url-helper.ts`,
`asset-tag-helper.ts`): `asset_path`/`path_to_asset`, `compute_asset_extname`,
`compute_asset_path`/`public_compute_asset_path`, `compute_asset_host`,
`stylesheet_path`/`path_to_stylesheet`, `stylesheet_link_tag`,
`send_preload_links_header`, `URI_REGEXP`, `ASSET_EXTENSIONS`,
`ASSET_PUBLIC_DIRECTORIES`, `MAX_HEADER_SIZE`.

Missing, all in the same two Ruby files:

- `asset_url_helper.rb:216-218, 352-360` — the `*_url` family: `asset_url`
  /`url_to_asset`, `stylesheet_url`/`url_to_stylesheet`, and the `protocol:
:request` arm they pass.
- `asset_url_helper.rb:326-334, 348-350, and the image/video/audio/font
siblings` — `javascript_path`/`path_to_javascript`, `image_path`,
  `video_path`, `audio_path`, `font_path` and their `_url` twins.
- `asset_tag_helper.rb:113-147` — `javascript_include_tag`.
- `asset_tag_helper.rb:244-` — `auto_discovery_link_tag`, `favicon_link_tag`,
  `preload_link_tag`, `image_tag`, `picture_tag`, `video_tag`, `audio_tag`,
  and the `image_loading` / `image_decoding` mattr slots
  (`asset_tag_helper.rb:25-26`).

The converged shape is the rest of both Ruby files ported into the two existing
TS files, in Rails source order (`rails-file-structure-method-order` covers the
ordering once the manifest sees them), with the matching Rails test tables
(`asset_tag_helper_test.rb:100-230`) enrolled in the existing
`template/asset-tag-helper.test.ts`.

This is larger than one PR — it should be split per helper family. The whole
remaining surface is roughly **900 LOC**, which is why `est-loc` is left unset
here rather than carrying that number: it exceeds the 700 LOC per-PR ceiling and
is an estimate for the epic, not for any PR. Each per-family split story sets
its own `est-loc` within the ceiling.

## Acceptance criteria

- Split into per-family stories under this RFC before starting.
- Each ported method mirrors its Ruby counterpart method-for-method, and its
  Rails test rows are enrolled in `template/asset-tag-helper.test.ts` under the
  verbatim Rails names.
- `parity:test`'s `asset_tag_helper_test.rb` row climbs from 5/114 toward 114/114
  and `parity:api:extra` stays at 0 novel for both files.
