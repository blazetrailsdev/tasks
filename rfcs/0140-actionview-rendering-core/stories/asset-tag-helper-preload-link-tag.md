---
title: "Port AssetTagHelper#preload_link_tag and resolve_link_as"
status: in-progress
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8208
claim: "2026-09-28T02:24:22Z"
assignee: "asset-tag-helper-javascript-include-tag"
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
`preload_link_tag` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:355`)
and its private `resolve_link_as` (`:640`) are unported. `send_preload_links_header`
(`:654-`) is already ported in `packages/actionview/src/helpers/asset-tag-helper.ts`.

Tests: `PreloadLinkToTag` (`asset_tag_helper_test.rb:320-333`) and the
`test_preload_link_tag*` methods.

## Acceptance criteria

- `preloadLinkTag` and the private `resolveLinkAs` mirror Rails, in source order.
- Its Rails tests are enrolled under verbatim names.
