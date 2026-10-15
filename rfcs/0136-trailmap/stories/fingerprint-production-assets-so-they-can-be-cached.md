---
title: "trailmap: digest-stamp production assets so the generated far-future cache header can be adopted"
status: draft
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/build-assets.sh` copies `app/assets` under fixed names. So trailmap#70
declined the far-future `publicFileServer.headers` that `trails new` writes for
production (`"cache-control": "public, max-age=31556952"`, generator
`:661`): a deploy's new `dashboard.js` would hide behind a year-cached old
one. The reason is recorded in `config/environments/production.ts`.

## Acceptance criteria

- Production assets are served under content-digested names, and the layout links those names.
- `config/environments/production.ts` adopts the generated cache header and drops the decline comment.
- `smoke-boot.sh` checks that a digested asset is served with the long cache header.
