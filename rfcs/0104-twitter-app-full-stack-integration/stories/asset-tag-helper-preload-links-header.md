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
PR as the layout's asset entry point, but two arms of
`actionview/lib/action_view/helpers/asset_tag_helper.rb:202-242` were left out
and carry `@missingRailsCall` receipts at
`packages/actionview/src/helpers/asset-tag-helper.ts`:

- **`send_preload_links_header`** (`asset_tag_helper.rb:214-220, 237-239`) —
  the `preload_links_header` / `nopush` / `integrity` / `crossorigin` Link
  header arm. Its body (`asset_tag_helper.rb:654-676`) needs
  `response.sending?`, `response.headers["link"]` and
  `request.send_early_hints`, none of which the trails view reaches:
  `CONTROLLER_DELEGATES`
  (`packages/actionview/src/helpers/controller-helper.ts:28`) does delegate
  `response`, but there is no `sendEarlyHints` and no `MAX_HEADER_SIZE`
  constant ported.
- **`content_security_policy_nonce`** (`asset_tag_helper.rb:227-229`) — the
  `nonce: true` arm. The method exists at
  `packages/actionpack/src/action-controller/metal/content-security-policy.ts:157`
  but is not in `CONTROLLER_DELEGATES`, so the view cannot call it.
  `asset_tag_helper.rb` reaches it through `ActionView::Helpers`' include of
  `ContentSecurityPolicyHelper` / the controller delegate.

`javascriptIncludeTag` (`asset_tag_helper.rb:113-148`) shares both arms
verbatim, so whoever ports it lands in the same place.

## Acceptance criteria

- `sendPreloadLinksHeader` is ported from `asset_tag_helper.rb:654-676`
  (with `MAX_HEADER_SIZE`), and `stylesheetLinkTag` runs the
  `use_preload_links_header` branch — the `preloadLinks` accumulation and the
  trailing `sendPreloadLinksHeader(preloadLinks)` — as Rails writes it.
- The `tagOptions["nonce"] === true` branch resolves
  `contentSecurityPolicyNonce` through the view, whatever delegation that
  needs.
- Both `@missingRailsCall` receipts in
  `packages/actionview/src/helpers/asset-tag-helper.ts` are deleted, and
  `pnpm parity:api:calls` stays green.
