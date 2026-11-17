---
title: "Lay out the remaining pages to the GitHub style guide"
status: in-progress
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trailmap#151
claim: "2026-11-17T12:21:22Z"
assignee: "lay-out-the-remaining-pages-to-the-github-style-guide"
blocked-by: null
closed-reason: null
---

## Context

trailmap#145 added `docs/style-guide.md` (look like GitHub) and laid the
dashboard, the command palette, the header and the story/RFC sidebar buttons
out to it. Every other page only picked up the shared tokens, fonts, buttons
and controls; none was laid out to the guide or reviewed against it. The guide
ends with the steps (`docs/style-guide.md:177`, "Adopting this on a page").

Pages still to bring over, each in `app/views/` and its twin in
`rails/app/views/`: home, RFC list, backlog, RFC show (the story list), story
show (the document and dependency boxes), packages, parity, audits, deploys,
sessions, panes, search, the repo tabs and owners.

Known mismatches seen in passing: h1 at 32px weight 400 and other sizes outside
the guide's three; `.badge` / `.state` pills in fills the guide does not list;
`.input` on `app/views/panes/show.html.tse:26` is an unstyled field (the guide's
control is `.ctl`).

## Acceptance criteria

- Each page listed uses only the guide's components, type sizes and radii, in
  both apps, with the same output from each.
- No view uses `class="input"`; form fields are `.ctl`.
- Each page's PR carries light, dark and 390px screenshots.
- This can be split per page; the story is done when no page is left.
