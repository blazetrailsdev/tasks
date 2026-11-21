---
title: "tse-view-diagnostics-map-to-tse-source"
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

Plain `tsc` over `.trails/views/**/*.tse.ts` reports diagnostics at the generated `.ts`
positions (`.trails/views/posts/_post.html.tse.ts(59,26)`), not the `.tse` source, although
`build-views` writes chained source maps. `trails-tsc` (activerecord-cli `tsc-wrapper`,
`ar-program.ts`) and `packages/trails-tsc/lib/remap.ts` remap virtualized `.tse` files; check
whether either maps diagnostics for the `.trails/views` stand-ins `trails-tsc-views build`
emits, and wire it (CLI or `trails-tsc-views check`) if not.

## Acceptance criteria

- One documented command type-checks an app and reports view errors as `app/views/...tse(line,col)`.
- Regression test through the real build pipeline asserts the `.tse` position; fails on baseline.
