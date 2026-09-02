---
title: "Generated layout hardcodes an undigested asset path, so the stylesheet 404s against a production build"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7371 fixed the generated `vite.config.ts` so `/` reaches Rack and
`rollupOptions.input` resolves, but it left a second half of the asset
pipeline unwired: the generated layout hardcodes an **unhashed** asset URL
while the build emits a **hashed** filename plus a manifest.

`packages/trailties/src/generators/app-generator.ts:734` emits:

```html
<link rel="stylesheet" href="/assets/stylesheets/application.css" />
```

but `vite build` with the generated config (`manifest: true`,
`build.outDir: "../public/assets"`) writes
`public/assets/assets/application-<hash>.css` and a
`public/assets/.vite/manifest.json` mapping the entry to it. PR #7371's own
test asserts the hashed name (`/application-.*\.css$/` in
`packages/trailties/src/server/dev-server.test.ts`). So the link resolves in
dev — Vite serves the source file from `root: "app"` — and **404s against a
production build**, which is exactly the failure
`no-static-or-asset-pipeline` (PR #7295) closed for the dev case.

Rails' answer is `stylesheet_link_tag`
(`actionview/lib/action_view/helpers/asset_tag_helper.rb:120-152`), which
routes the logical name through `path_to_stylesheet` ->
`AssetUrlHelper#asset_path`
(`actionview/lib/action_view/helpers/asset_url_helper.rb:184-217`) so the
digested name comes from the pipeline rather than from the template. The
converged shape is the layout calling a helper, not a literal href.

## Acceptance criteria

- The generated layout names the asset logically (a `stylesheetLinkTag`-shaped
  call, per `asset_tag_helper.rb:120`), not as a hardcoded digest-free path.
- The resolved href comes from the Vite manifest when a build exists, and
  falls back to the dev path otherwise.
- A test builds a generated app and asserts the rendered layout's href is the
  hashed file that `vite build` actually emitted.
