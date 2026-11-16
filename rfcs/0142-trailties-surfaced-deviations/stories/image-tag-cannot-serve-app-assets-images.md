---
title: "imageTag of a file in app/assets/images has no served, digested URL; trailmap copies its SVG to public/ instead"
status: draft
updated: 2026-11-16
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#148 checked in `app/assets/images/mark.svg` as the header mark's source. Rails (Propshaft) serves `image_tag "mark.svg"` from `app/assets/images` with a digested URL. trails' Vite pipeline (`vite.config.ts` from `trails new`, built by `scripts/build-assets.sh`) only emits files reached from an entry, so an image referenced only from a view gets no build output and no manifest entry. That leaves `imageTag("mark.svg")` without a served, digested path in production. trailmap works around this: `scripts/build-icons.sh` copies the SVG to `public/mark.svg`, and both layouts link `/mark.svg`.

Not verified in trails source: confirm against `actionview` `computeAssetPath` and the trailties vite config before fixing.

## Acceptance criteria

- `imageTag("x.svg")` for a file in `app/assets/images` renders a digested `/assets/...` URL in production and resolves in development, as Rails does.
- There is a test in trails covering the case.
- trailmap drops the `public/mark.svg` copy once trails is re-vendored.
