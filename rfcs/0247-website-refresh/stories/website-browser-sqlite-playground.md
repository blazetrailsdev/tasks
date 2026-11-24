---
title: "Website hosts the browser-sqlite example as a /playground"
status: ready
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: website-deploy
packages: ["website"]
deps: ["browser-sqlite-static-production-bundle"]
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

`examples/browser-sqlite` (trails#10630) is an editable trails blog running in the browser on sql.js, with an editor, a preview and a console. The website (`packages/website`, SvelteKit with adapter-static, deployed to GitHub Pages) could host it as an interactive playground. The example stays in `examples/`, and the website ships only its build output.

It is blocked on `browser-sqlite-static-production-bundle`: today the example runs only on the Vite dev server.

Absolute paths are hard-coded in `examples/browser-sqlite/public/sw.js` (`/preview`, `/rt/`), `src/host/main.ts` (`/sw.js`, `/runtime.html`), `runtime.html`'s import map (`/expo-sqlite.js`) and `src/runtime/main.ts` (`/rt/<run>/`).

## Acceptance criteria

- The example builds under a base path (`vite build --base /playground/`): every absolute path above derives from `import.meta.env.BASE_URL`, and the service worker is registered with that scope.
- The website's `build` builds the example and serves its output at `/playground/`, without importing the example's source.
- A website page links to or embeds the playground. The site's nav reaches it.
- `pnpm smoke` passes against the built playground served by `vite preview` of the website.
