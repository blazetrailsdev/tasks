---
title: "move-browser-sqlite-into-website-as-playground"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
est-loc: 400
packages:
  - website
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

The playground served at `{base}/playground/` is built from `examples/browser-sqlite` by `packages/website/package.json:9` (`playground:build`), and smoke-tested by `.github/workflows/pages.yml:57-63` and `.github/workflows/playground.yml`. The editor/host half is `examples/browser-sqlite/src/host/` (main.ts, editing.ts, find.ts, highlight.ts, share.ts, storage.ts, type-check\*.ts, zip.ts). The runtime half is `src/runtime/` (vfs, rack-bridge, expo-sqlite-sqljs, template-compiler, generate, modules) plus `src/shims/`, `templates/{blog,library}`, `runtime.html`, `scripts/smoke.mjs`.

## Acceptance criteria

- The playground lives in `packages/website` as "playground" (no `@blazetrails/example-browser-sqlite` package left behind for it); `playground:build` builds it from there.
- The website owns the runtime (`src/runtime`, `src/shims`, templates) so the app-only example (`app-only-browser-sqlite-example`) can import it from the website.
- `pages.yml` and `playground.yml` path filters, filters and smoke steps point at the new location; smoke passes.
- The homepage link in `packages/website/src/routes/+page.svelte:129` ("source") points at the new location.
