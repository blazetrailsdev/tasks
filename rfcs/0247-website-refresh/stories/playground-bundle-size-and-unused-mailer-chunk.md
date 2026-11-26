---
title: "Playground bundle: find why actionmailer and libxml2 ship, and shrink it"
status: ready
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The playground bundle (`examples/browser-sqlite`, `vite build`) is about 14.3MB raw and 4MB gzipped (measured 2026-11-25 on trails#10753's tree). The largest chunks: `typescript-*.js` 4.05MB raw / 1.15MB gzip, a chunk Rollup names `mailers-controller-*.js` at 1.66MB raw / 150KB gzip, `extension-*.js` 1.14MB / 485KB gzip (libxml2-wasm), and two `index-*.js` at 1.14MB and 0.56MB. The example app sends no mail and its `PACKAGE_NAMES` (`src/runtime/package-names.ts`) do not include actionmailer, so the mailer chunk is reached through trailties' own imports.

## Acceptance criteria

- Report, in the PR, which import edge pulls actionmailer (and nokogiri's libxml2 extension) into a bundle whose app uses neither, and whether it can be cut in the example or needs a trailties change. File the trailties change as its own story if so.
- The bundle's gzipped size is recorded before and after, and is smaller.
- `pnpm smoke` and `DIST=... pnpm smoke` still pass.
