---
title: "asset-tag-helper-preload-links-header"
status: draft
updated: 2026-09-02
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

`stylesheetLinkTag` was ported in the `generated-layout-hardcodes-undigested-asset-path`
PR (#7379) as the layout's asset entry point. Its body accumulates
`preload_links` exactly as
`actionview/lib/action_view/helpers/asset_tag_helper.rb:214-220` does, but the
trailing `send_preload_links_header(preload_links)`
(`asset_tag_helper.rb:237-239`) is not made, and carries a `@missingRailsCall`
receipt at `packages/actionview/src/helpers/asset-tag-helper.ts`.

`send_preload_links_header`'s body (`asset_tag_helper.rb:654-676`) needs
`response.sending?`, `response.headers["link"]` and
`request.send_early_hints`. `CONTROLLER_DELEGATES`
(`packages/actionview/src/helpers/controller-helper.ts:28`) does delegate
`response`, but the trails request has no `sendEarlyHints` and
`MAX_HEADER_SIZE` is not ported.

`javascriptIncludeTag` (`asset_tag_helper.rb:113-148`) shares the same arm
verbatim, so whoever ports it lands in the same place.

## Acceptance criteria

- `sendPreloadLinksHeader` is ported from `asset_tag_helper.rb:654-676` (with
  `MAX_HEADER_SIZE`), including the `send_early_hints` and
  `response.headers["link"]` arms.
- `stylesheetLinkTag` calls it under `use_preload_links_header`, as Rails
  writes it, and the `@missingRailsCall` receipt in
  `packages/actionview/src/helpers/asset-tag-helper.ts` is deleted.
- `pnpm parity:api:calls` stays green.
