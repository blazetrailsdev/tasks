---
title: "trailmap: /packages/:name/work lists attributed stories by RFC with a done-over-time burndown"
status: claimed
updated: 2026-11-06
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [packages-index-page, story-touching-package-scope]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-11-06T12:56:48Z"
assignee: "package-overview-page"
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
