---
title: "trailmap: screenshots of the External inbox's Trust and Forward states (follow-up to #190)"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#190 merged without the screenshots trailmap's CLAUDE.md requires
("Every PR body carries screenshots of the pages it touches"). The pulls tab's
External inbox (`app/assets/javascripts/external-prs.js`: `row`, `heldRow`,
`heldGroup`, `inboxLayout`) draws grants and held reviews only when ringo
serves `GET /api/pr-trust` and `GET /api/external-on-trusted`. Those come from
the btwebooks branch `ringo-pr-trust-grant` (30b5ba1, 3deba45, 7c1db20),
which was not deployed when #190 merged. A fixture page was refused, and
running a second live ringo risks double webhook delivery and spawns.

## Acceptance criteria

- Once that ringo branch is deployed, add to #190's description screenshots
  of `/<owner>/<repo>/pulls`, at desktop width and a real 390px width, that
  show a Trusted row, an untrusted row with **Trust this PR**, a held group
  under its PR, and an open **Forward to agent** box.
- Any layout defect the shots reveal (for example the held group's
  blockquote or actions wrapping at 390px) is fixed in the same PR.
