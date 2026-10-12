---
title: "trailmap: /backlog rows run past the right edge at 390px"
status: done
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-12T16:01:33Z"
assignee: "backlog-rows-overflow-a-phone-screen"
blocked-by: null
closed-reason: null
---

## Context

Seen in the 390px screenshot for trailmap#36: on `/backlog` the rows run past the right edge of a
phone screen. Titles, the tag line and the meta line are clipped, and the tab row wraps with the
last tab cut off. `/rfcs` was fixed for phones in trailmap#28; `/backlog` uses the same `.item-row`
markup (`app/views/story-pages/index.html.tse`) but carries a status badge and a right-hand PR link
that `/rfcs` does not, and nothing constrains them at narrow widths
(`app/assets/stylesheets/application.css`, `.item-row`, `.row-main`, `.row-aside`).

## Acceptance criteria

- [ ] At 390px no row on `/backlog` overflows the viewport: titles wrap, tags wrap, the PR link drops beneath or stays in view.
- [ ] The tab row and the pager are fully visible at 390px.
- [ ] Screenshots at 390px of the Open and Closed tabs in the PR.
