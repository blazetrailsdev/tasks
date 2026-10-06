---
title: "trailmap: replace the dashboard's hand-passed CSRF token with csrf_meta_tags"
status: draft
updated: 2026-10-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#40 carries one agreed-temporary workaround. `DashboardController#index`
(`app/controllers/dashboard-controller.ts`) calls `this.formAuthenticityToken()` and passes it to
the view as `csrfToken`; `app/views/dashboard/index.html.tse` writes it into `data-csrf-token` on
`#fleetConfig`; `csrfHeaders()` in `app/assets/javascripts/dashboard.js` reads it from there.
Rails puts the token in the layout with `csrf_meta_tags`, which trails has not ported (trails story
`port-action-view-csrf-helper`, RFC 0142).

This is the story CLAUDE.md asks for: it tracks the workaround's removal.

## Acceptance criteria

- [ ] The vendored trails has `csrfMetaTags()`.
- [ ] `app/views/layouts/application.html.tse` calls it; the `csrfToken` local, the `data-csrf-token` attribute and their comment are gone; `csrfHeaders()` reads `meta[name="csrf-token"]`.
- [ ] `scripts/smoke-boot.sh` reads the token from the meta tag and its three forgery-protection assertions still pass.
