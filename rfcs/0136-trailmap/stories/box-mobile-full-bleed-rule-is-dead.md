---
title: "The phone full-bleed .box rule never applies: a later .box declaration overrides it"
status: in-progress
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#153
claim: "2026-11-17T18:21:25Z"
assignee: "box-mobile-full-bleed-rule-is-dead"
blocked-by: null
closed-reason: null
---

## Context

trailmap `app/assets/stylesheets/application.css` has a 640px rule (around line 276, beside the first `.box` declaration):

    .box { border-radius: 0; border-left: none; border-right: none; margin: 0 -16px; }

It is meant to run every boxed list edge to edge on a phone. It never applies to border-radius or the side borders, because a second `.box { border: 1px solid ...; border-radius: 6px; ... }` (around line 366) comes later in the file and wins. Only the negative margin takes effect, so a box sits flush to the screen edge but keeps its rounded, bordered sides.

trailmap#149 hit this. It first fixed the rule globally, which changed about 20 pages without screenshots, so the change was scoped to `.box.rfc-list`. That scoped rule should be removed once this lands.

The pages affected include owners, home, search, the repo-\* pages (issues, pulls, projects, settings, code, wiki, actions, insights), story pages, packages/work, mail-tests and rfc-pages/show. `margin: 0 -16px` assumes the box is a direct child of `.wrap`. A box inside a sidebar or column would bleed into its neighbour.

## Acceptance criteria

- One `.box` declaration, with the phone rule after it.
- Only a box that is a direct child of `.wrap` bleeds (`.wrap > .box`). A nested box keeps its border.
- The `.box.rfc-list` special case from #149 is removed.
- 390px shots of every boxed page, each with `innerWidth` 390 and `scrollWidth` ≤ 390.
