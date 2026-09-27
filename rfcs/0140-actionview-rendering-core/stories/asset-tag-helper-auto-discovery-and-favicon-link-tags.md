---
title: "Port AssetTagHelper#auto_discovery_link_tag and #favicon_link_tag"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
Unported in `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb`:
`auto_discovery_link_tag` (`:271`, reads `url_for` and `Mime[type]`) and
`favicon_link_tag` (`:312`, `path_to_image` with `skip_pipeline`).
`imagePath`/`pathToImage` exist in `packages/actionview/src/helpers/asset-url-helper.ts`.

Tests: `AutoDiscoveryToTag` (`asset_tag_helper_test.rb:86-100`),
`FaviconLinkToTag` (`:312-318`) and their `test_auto_discovery_link_tag*` /
`test_favicon_link_tag*` methods.

## Acceptance criteria

- Both helpers ported into `helpers/asset-tag-helper.ts` in Rails source order.
- Their Rails tests are enrolled under verbatim names.
