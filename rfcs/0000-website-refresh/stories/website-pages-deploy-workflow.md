---
title: "Deploy the website to GitHub Pages from main"
status: draft
updated: 2026-11-18
rfc: "0000-website-refresh"
cluster: website-deploy
packages: [website]
deps: [website-remove-frontiers, website-docs-typedoc-fails-under-ts5]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 2. `.github/workflows/` holds only `ci.yml` and `perf.yml`, and
nothing deploys the site. The SvelteKit app uses `adapter-static` with
`fallback: "index.html"` and no `paths.base` (`packages/website/svelte.config.js:1-14`).
VitePress has `base: "/docs/"` and `outDir: "../build/docs"`
(`docs/.vitepress/config.ts:8-9`), so both builds already land in
`packages/website/build/`. The project URL is
`https://blazetrailsdev.github.io/trails/`. The PR-side check is the `Website`
job (`ci.yml:2124-2160`), which `website-docs-typedoc-fails-under-ts5`
re-enables. This story depends on it, so `main` builds before it deploys.

## Acceptance criteria

- [ ] `.github/workflows/pages.yml` runs on `push` to `main` (path-filtered to exactly `packages/website/**`, `packages/*/lib/**`, `packages/*/package.json`, `README.md`, `scripts/quickstart/**` and `.github/workflows/pages.yml`; this is the one place the list is defined), on `workflow_dispatch`, and on a daily `schedule`. A `build` job uploads `packages/website/build` with `actions/upload-pages-artifact`. A `deploy` job runs `actions/deploy-pages` with `environment: github-pages`, `pages: write`, `id-token: write`, and a non-cancelling `pages` concurrency group.
- [ ] One env var, `SITE_BASE`, drives both `kit.paths.base` and the VitePress ``base: `${SITE_BASE}/docs/` ``. Every internal link in `src/` uses `$app/paths`, and `git grep 'href="/' packages/website/src` is empty.
- [ ] `fallback` is `404.html`. The root layout prerenders, and a refresh on a deep docs URL and on an unknown path both render under the base path.
- [ ] The website build writes `build/.nojekyll`, and `_app/` is served on Pages.
- [ ] The CI `Website` job builds with `SITE_BASE=/trails`, and PR CI gains no new job.
- [ ] No custom domain or `CNAME`. The PR body lists the operator's repo-settings step (Pages source: GitHub Actions).
- [ ] After merge, the Pages URL serves `/` and `/docs/`, and the PR body records the URL.

## Notes

No service worker remains after `website-remove-frontiers`. If one is added
later, it registers with scope `` `${base}/` ``.
