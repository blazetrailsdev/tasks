---
title: "website-serve-at-blazetrails-dev-domain"
status: done
updated: 2026-11-20
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10436
claim: "2026-11-20T19:41:46Z"
assignee: "website-serve-at-blazetrails-dev-domain"
blocked-by: null
closed-reason: null
---

## Context

The site deploys from this repo's `.github/workflows/pages.yml`, which builds with
`SITE_BASE: /trails` (line 31), so it serves at `blazetrailsdev.github.io/trails`.
Both `packages/website/svelte.config.js:10-14` (`paths.base`, docs prefix) and
`packages/website/docs/.vitepress/config.ts:4` (`siteBase`) read `SITE_BASE`, and
an empty value serves from the root. The project owns `blazetrails.dev`; the site
should serve there at the root.

## Acceptance criteria

- `packages/website/static/CNAME` holds `blazetrails.dev`, so it is copied into
  the Pages artifact.
- `pages.yml` builds with `SITE_BASE` empty (or unset), so links and assets
  resolve from `/`.
- Every hard-coded `blazetrailsdev.github.io/trails` URL in the repo (the root
  `README.md` and any website/docs references) points at `https://blazetrails.dev`.
- The PR body lists the operator steps outside the repo: the DNS records for
  `blazetrails.dev` (apex A/AAAA to GitHub Pages, or ALIAS), the custom domain
  setting in the repo's Pages settings, and "Enforce HTTPS".
- After deploy, `https://blazetrails.dev/` and `https://blazetrails.dev/docs/`
  load with working asset and docs links.
