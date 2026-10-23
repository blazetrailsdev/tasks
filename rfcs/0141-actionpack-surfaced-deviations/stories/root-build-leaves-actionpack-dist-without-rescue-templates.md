---
title: "Root build leaves actionpack's dist without its rescue templates, so a packed actionpack can't render error pages"
status: ready
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Root `pnpm build` is `tsc --build && pnpm -C packages/trailties build:templates`
(trails root `package.json`). It skips the rest of `@blazetrails/actionpack`'s own
`build` script (`packages/actionpack/package.json`): copying
`src/action-dispatch/middleware/templates` and `journey/visualizer` into `dist/`
and precompiling them with `trails-tsc-views build --in-place`. After a root
build, `packages/actionpack/dist` has no rescue templates. `pnpm pack` then ships
a package whose `DebugExceptions` raises
`ActionView::MissingTemplate: Missing template rescues/diagnostics` on the first
error page (`DebugView.RESCUES_TEMPLATE_PATHS`,
`packages/actionpack/src/action-dispatch/middleware/debug-view.ts:7-9`).

Hit while vendoring trails into trailmap (trailmap#72); the workaround was
running `pnpm -C packages/actionpack build` by hand before packing. Nothing
fails on it in trails CI, because vitest reads the templates from `src/`.

## Acceptance criteria

- One build entry point produces a complete `dist/` for every package whose own
  `build` does more than `tsc` (today actionpack and trailties): either root
  `build` delegates those steps, or each package gets a `prepack` that runs them,
  so `pnpm pack` can't publish an incomplete package.
- A check (script test or CI step) packs actionpack after the root build and
  asserts `dist/action-dispatch/middleware/templates/rescues/diagnostics.html.tse.js`
  is in the tarball.
