---
title: 'trailmap: the RFC show page prints "0 loc" for an est-loc of 0, where /backlog now prints nothing'
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
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

`app/views/rfc-pages/show.html.tse:38` prints a story row's estimate under
`story.estLoc !== null`, so a story authored with `est-loc: 0` reads
`<id> · 0 loc`. trailmap#46 changed the same test on `/backlog`
(`app/views/story-pages/index.html.tse:36`) to omit a zero, because ringo's
backlog row draws it under `if (s.est_loc)`.

This is not a port defect and no gate sees it: ringo's RFC show page prints no
estimate on a story row at all (`webhook/rfcs.go:843` at pin faf67c0 — status
badge, priority, title, PR), so `· N loc` is trailmap's own addition and
neither `gate:pages` nor `gate:snapshot` extracts it. What is left is that
trailmap's two pages now disagree about the same story: `/backlog` says it has
no estimate, `/rfc/<id>` says `0 loc`. Three RFC 0188 stories
(`audit-inherited-hooks-for-an-inlined-from-entry`,
`claude-md-section-for-inlined-module-initialize`,
`sample-class-constructors-for-the-hoisted-super-case`) show it today on
`/rfc/0188-module-initialize-inlined-into-constructors`.

ringo treats zero as "no estimate" everywhere it draws one — the story page's
sidebar is `{{if .Story.EstLOC}}…{{else}}—{{end}}` (`webhook/story.go:685`) —
so omitting it is the consistent reading.

## Acceptance criteria

- A story row on `/rfc/<id>` with `est_loc` 0 prints no `loc` segment, the same
  as a row with no estimate; a non-zero estimate still prints.
- A test in `test/controllers/rfc-pages-controller.test.ts` pins the
  zero-estimate row.
- `pnpm gate:snapshot` passes with nothing re-recorded.
- PR body carries a screenshot of `/rfc/0188-module-initialize-inlined-into-constructors`.
