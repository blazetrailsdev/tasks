---
title: "Publish through npm trusted publishing (OIDC) and retire NPM_TOKEN"
status: draft
updated: 2026-11-26
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.github/workflows/release.yml` publishes every public package with `NPM_TOKEN`, a granular token that bypasses 2FA (expires 2027-02-21). npm is ending direct publishing with tokens that bypass 2FA in January 2027. The v0.1.0-alpha0.1 run (45281419331) logged `Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE ... 404`, because trusted publishing can only be set up on a package that already exists. trails#10779 fixed the token path (`~/.npmrc`) so the first publish can create the packages.

## Acceptance criteria

- After the first successful publish, every published `@blazetrails/*` package has a Trusted Publisher on npmjs.com for `blazetrailsdev/trails`, workflow `release.yml`.
- `release.yml`'s Publish step no longer writes `NPM_TOKEN` to `~/.npmrc`, and a tag push publishes through OIDC (`id-token: write` is already granted).
- The `NPM_TOKEN` repo secret and the npm `blazetrails` token are deleted.
- A package added after this needs a documented first-publish path (token or manual), noted in the release docs.
