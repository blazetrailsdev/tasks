---
title: "Retire trailties' invented Vite Trailtie and manifest onto vite-trails"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: vite
packages: [trailties]
deps: [vite-trails-package-and-tag-helpers]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/assets/trailtie.ts:13-27` is
`@noRailsEquivalent PERMANENT`. It assigns `computeAssetPath` onto
`ActionView::Base`'s prototype from `assets/vite-manifest.ts`, which reads
`public/assets/.vite/manifest.json` behind a hard-coded `/assets`
(`vite-manifest.ts:13-15`). That overrides actionview's faithful
`compute_asset_path` and puts Vite knowledge inside actionview's dispatch,
which the RFC's boundaries ruling forbids. The bug filed as
`asset-helpers-skip-vite-hook-outside-boot`
(0142-trailties-surfaced-deviations) comes from this design.
`ViteRails::Engine`'s `vite_rails.helper` initializer
(`vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/engine.rb:10-18`) is the shape this converges
onto. `trailties/lib/server/vite-plugin.ts` is out of scope
here and belongs to `vite-trails-dev-server-topology`.

## Acceptance criteria

- `trailties/lib/assets/trailtie.ts` and `vite-manifest.ts` are deleted, and
  no package assigns `computeAssetPath` onto `ActionView::Base`.
- Generated-app layouts use `vite_client_tag` and `vite_javascript_tag
"application"`, the same as vite_rails' install template.
- `asset-helpers-skip-vite-hook-outside-boot` is closed by this PR.
- `trailsPlugin` is not touched here. `vite-trails-dev-server-topology`
  removes it from the generated app and keeps it as test-only
  infrastructure (RFC open question 2).
