---
title: "app-typecheck-includes-trails-views"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
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

`trails-tsc-views build` writes stand-ins to `.trails/views/**/*.tse.ts` and
`.trails/template-registry-augmentation.d.ts`, but tsc's `include` globs skip dot-dirs, so
`examples/*`'s `pnpm typecheck` (`examples/cloudflare-worker/tsconfig.json` `include`) and
the app generator's tsconfig never check views. A `post.titel` typo is reported only once
`.trails/**/*.ts` is listed by hand.

## Acceptance criteria

- Generated app tsconfig (trailties app generator) and the examples' tsconfigs include
  `.trails/**/*.ts`, and their typecheck script runs `trails-tsc-views build` first.
- Regression test: generated tsconfig + build + tsc reports a typo in a view; fails on baseline.
