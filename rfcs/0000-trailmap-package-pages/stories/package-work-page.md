---
title: "trailmap: /packages/:name/work lists attributed stories by RFC with a done-over-time burndown"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [package-overview-page]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Pages" section. Stories come from `Story.touchingPackage`; the
burndown reads `events` (status transitions to `done`). Story rows reuse the
`story-pages` index partials.

## Acceptance criteria

- [ ] `GET /packages/:name/work` groups attributed stories by RFC, ready
      first, then in-progress, blocked, draft; done collapsed.
- [ ] A weekly done-count burndown from `events`.
- [ ] Controller test on fixtures.
