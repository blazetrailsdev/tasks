---
title: "Playground type-checks .tse views"
status: ready
updated: 2026-11-27
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
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

trails#10828 added type checking to the playground (`examples/browser-sqlite/src/host/type-check.ts`, `type-check.worker.ts`). It checks app `.ts` files only. `.tse` views are skipped: checking them means running each view through the `@blazetrails/trails-tsc/plugins/tse` virtualizer (which the bundle already aliases in `vite.config.ts`) and mapping the diagnostic positions back to the view source.

## Acceptance criteria

- Type errors in `.tse` views appear as warnings in the editor's problems list and gutter, on the view's own line.
- The smoke test (`scripts/smoke.mjs`) introduces a type error in a view and sees it reported while the app keeps running.
