---
title: "trailties: asset helpers render /stylesheets/x.css in a controller test, because the vite.helpers initializer only runs at boot"
status: closed
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10225
claim: "2026-11-17T06:18:39Z"
assignee: "asset-helpers-skip-vite-hook-outside-boot"
blocked-by: null
closed-reason: "FALSIFIED: its premise was trailties' vite.helpers initializer, deleted by trails#10225; Vite tags now come from vite-trails' TagHelpers via the engine's onLoad(action_view) include (vite_rails/lib/vite_rails/engine.rb:10-18), and actionview's compute_asset_path stays faithful."
---

## Context

`packages/trailties/src/assets/trailtie.ts:18` installs the manifest-aware
`computeAssetPath` on `ActionView::Base` in the `vite.helpers` initializer, so
only a booted application has it. An `ActionController::TestCase` that does
not boot (trailmap's `test/support/controller-test-case.ts`) renders through
actionview's default `computeAssetPath`: `stylesheetLinkTag("application")`
gives `/stylesheets/application.css`, with neither the `/assets` prefix nor
the manifest's digested name. Production gives
`/assets/application-<hash>.css`. trailmap#75 had to loosen its layout
assertions to the logical name, and `scripts/smoke-boot.sh` is the only thing
checking the real link.

Rails: asset helpers in an `ActionView::TestCase` or controller test resolve
through the same Propshaft/Sprockets resolver as the served app.

## Acceptance criteria

- An un-booted controller or view test renders the same asset path as a
  booted app for the same manifest: `/assets/...` with no manifest, and the
  digested file when `public/assets/.vite/manifest.json` exists.
- A trailties test covers both cases.
