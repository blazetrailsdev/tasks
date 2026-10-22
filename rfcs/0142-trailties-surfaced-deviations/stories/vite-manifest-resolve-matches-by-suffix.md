---
title: "trailties: ViteManifest.resolve falls back to a key suffix match, so two same-named assets collide silently"
status: draft
updated: 2026-10-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/assets/vite-manifest.ts:25-29`: `ViteManifest.resolve`
tries an exact key, then the first key that ends in `/<logicalPath>`. An entry
outside Vite's `root` is keyed by its relative path
(`../vendor/ringo/parity.css` in trailmap#75's manifest), so it can only be
reached by that suffix match. Two inputs with the same basename
(`app/assets/stylesheets/parity.css` and `vendor/ringo/parity.css`) collide,
and whichever key comes first wins without any error.

Rails/Propshaft resolve an exact logical path, and raise `MissingAssetError`
when it is unknown.

## Acceptance criteria

- An ambiguous suffix match raises (or resolve takes the logical path relative
  to a configured load path) instead of picking the first key.
- A test covers two same-basename entries.
