---
title: "playground-smoke-firefox-service-worker-bypass"
status: ready
updated: 2026-11-26
rfc: "0247-website-refresh"
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

`BROWSER=firefox DIST=dist pnpm smoke` (`examples/browser-sqlite/scripts/smoke.mjs`, Playwright 1.60 Firefox) fails at boot: the runtime frame reports `navigator.serviceWorker.controller` set, yet its `import()` of `/rt/<tab>/<session>/vfs/config/environment.ts` reaches the preview server (404, `NS_ERROR_CORRUPTED_CONTENT`, "disallowed MIME type"), and a `fetch` of the same URL from the frame returns the SPA's index.html, so `public/sw.js`'s fetch handler never answers it. Not yet checked in a non-Playwright Firefox. WebKit could not launch locally (host missing libva-drm, libnice, libx264), so it is unverified.

## Acceptance criteria

- Find whether this is Playwright-Firefox-only or real Firefox; fix the playground, or file it upstream.
- `BROWSER=firefox` and `BROWSER=webkit` smoke pass, and `.github/workflows/playground.yml` gains a browser matrix.
