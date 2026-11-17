---
title: "The header marks the section a page is in, not only an exact match"
status: done
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#148
claim: "2026-11-16T22:21:26Z"
assignee: "command-palette-footer-hints-follow-the-mode"
blocked-by: null
closed-reason: null
---

## Context

The header marks the current page with `isCurrentPage(path)`
(`app/views/layouts/application.html.tse:22`; `current_page?` in
`rails/app/views/layouts/application.html.erb`), which is an exact match. So
`/rfcs` underlines RFCs but `/rfc/0234-no-void-promises` underlines nothing,
and the same for a story under Backlog, a package's pages under Packages, a
pane under Sessions. GitHub keeps the section's tab marked on every page inside
it.

## Acceptance criteria

- A page inside a section marks that section's header link: RFC show pages mark
  RFCs, story pages mark Backlog, `/packages/*` marks Packages, and so on for
  each header link that has child pages.
- `aria-current="page"` stays on an exact match only; a section match gets the
  underline without it.
- The rule is written once and used by both layouts, with a test on each side.
