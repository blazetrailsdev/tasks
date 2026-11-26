---
title: "Page scripts survive Turbo Drive, so their pages drop the reload opt-out"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap loads Turbo Drive from `app/assets/javascripts/application.js` (both apps,
via the `rails/app/javascript` symlink). Nine pages run their own module script
once at load: dashboard, deploys, audits, panes/show, parity-graphs/show,
rfc-pages index and show, story-pages/show, repo-pulls/index. A module URL
already in the document's module map never runs again, and a page's sockets and
timers outlive its swapped body. So each of those pages opts out with
`turbo-visit-control: reload` (`contentFor("head")` / `turbo_page_requires_reload`),
and `application.js` forces a full load when you leave one too.

## Acceptance criteria

- Each page script starts on `turbo:load` (or as a Stimulus controller) and tears
  down its sockets, timers and document listeners on `turbo:before-render`.
- The reload opt-out goes from each converted page, in both apps.
- Clicking between those pages keeps one JS session, with no `pageerror`.
