---
title: "trailmap: link /packages from the top nav in both apps"
status: in-progress
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#126
claim: "2026-11-07T01:47:08Z"
assignee: "deviations-mark-null-matched-renders-null"
blocked-by: null
closed-reason: null
---

## Context

trailmap#120 added `GET /packages` (`as: "packages"`, trailmap `config/routes.ts` beside `graphs/parity`) in both apps. Nothing links to it: the top nav in `app/views/layouts/application.html.tse:24` stops at `<a href="<%= parityGraphPath() %>">Parity</a>`, and the Rails twin's layout `rails/app/views/layouts/application.html.erb` does the same. Today the page is only reachable by typing the URL.

## Acceptance criteria

- [ ] Both layouts have a "Packages" nav link next to "Parity", using `packagesPath()` / `packages_path`.
- [ ] The phone-width menu includes it too.
- [ ] A layout or controller test asserts the link is rendered in each app.
