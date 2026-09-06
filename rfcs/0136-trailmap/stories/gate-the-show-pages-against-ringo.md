---
title: "Gate the RFC and story show pages against ringo's, over the whole database"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`render-the-rfc-and-story-show-pages` (#11) shipped `/rfc/<id>` and
`/story/<id>` with this acceptance criterion:

> For every RFC and story in the database, trailmap's page shows the same
> title, status, story list, done-count and rendered markdown as ringo's.

It was verified by hand — SQL cross-checks of the done-count against three
RFCs, and eyeballing two rendered pages. That found a real defect
(`rfcStoryCounts` was proven to drop closed stories on live data:
`0078-sti-schema-reflection-fidelity` has 8 closed stories and the page reads
48/48, not 48/56), so the check was worth doing. But it is not repeatable, it
does not run in CI, and "for every RFC and story" was never actually
exercised — three RFCs were.

Contrast [[equivalence-gate-trailmap-against-the-cli]], which proves the ready
queue byte-for-byte over the whole database on every PR. The pages have no
such gate.

## Distinct from the markdown gate

[[gate-the-markdown-renderer-against-ringo]] compares `renderMarkdown`'s
output against `webhook/markdown.go` for a corpus of bodies. That is the
renderer in isolation. This is the PAGE: title, status, the story list and
its order, and the done-count — the parts assembled by
`app/controllers/rfc-pages-controller.ts` and
`app/models/concerns/rfc-progress.ts`, none of which the markdown gate sees.

## Sequencing

This needs ringo still serving its versions to diff against, so it must land
BEFORE [[land-the-ringo-read-model-deletion]] — after that there is no
reference implementation left and the criterion becomes unprovable. That
ordering is the reason to file it now rather than when someone gets to it.

## Acceptance criteria

- A script fetches both implementations' `/rfc/<id>` and `/story/<id>` for
  every id in the database and compares the extracted title, status, ordered
  story list and done-count.
- A difference is a failure, in the voice of `scripts/equivalence.ts`.
- Markup differences that are deliberate (#7's status vocabulary, the GitHub
  restyle) are compared on extracted VALUES, not raw HTML, so the gate does
  not fail on styling it is not about.
