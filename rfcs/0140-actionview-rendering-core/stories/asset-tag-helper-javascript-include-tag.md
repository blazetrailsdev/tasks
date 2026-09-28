---
title: "Port AssetTagHelper#javascript_include_tag"
status: done
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
`javascript_include_tag` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/asset_tag_helper.rb:113`)
is unported. It mirrors the already-ported `stylesheetLinkTag`
(`packages/actionview/src/helpers/asset-tag-helper.ts`): `path_options`
extraction, `preload_links` collection for `send_preload_links_header`,
`crossorigin`/`integrity`/`nonce` (`content_security_policy_nonce`) and the
`type`/`defer`/`async` arms. `javascript_path` is now ported in
`asset-url-helper.ts`, so `path_to_javascript` is available.

Tests: `JavascriptIncludeToTag` (`asset_tag_helper_test.rb:133-142`) and the
`test_javascript_include_tag*` family (grep `def test_javascript_include_tag` in
that file), plus the preload-links-header cases that name
`javascript_include_tag`.

## Acceptance criteria

- `javascriptIncludeTag` mirrors `asset_tag_helper.rb:113` line for line, placed before `stylesheetLinkTag`.
- Its Rails tests are enrolled in `template/asset-tag-helper.test.ts` under verbatim names.
