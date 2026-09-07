---
title: "Gate /rfcs and /backlog against ringo's data, per tab"
status: draft
updated: 2026-09-07
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

`gate-the-show-pages-against-ringo` exists because a port with no automated
diff is a port nobody can prove. The list pages landed in #15 with the same
exposure and no equivalent: `/rfcs` and `/backlog` were ported from ringo's
two `draw()` scripts, and the ONLY thing holding the port still is unit tests
written from the same reading of the Go that produced the code.

Two reviews of #15 flagged this from the other side — no ringo checkout was
available in the review environment, so the `webhook/*.go:LINE` citations in
the diff's comments could not be verified at all. The reviewer checked
internal consistency instead and said so. Pinning the citations to
btwebooks `7897c57` and quoting the snippets in the PR body converted "trust
the comment" into "trust the quote"; it did not close the gap.

What must agree, over the full database, per tab:

- `/rfcs`: the RFC set and its ORDER (priority asc, unset last; equal explicit
  priority breaks on fewer open stories then id — `webhook/rfcs.go:595`), the
  five tab counts, and each row's done/total from `rfcStoryCounts`.
- `/backlog`: the story set per tab, the tab counts, and the queue positions.
  The tab predicates are `matchesFilter` (`webhook/backlog.go:178`) and the
  Draft/Icebox partition is the one most likely to drift.

`scripts/equivalence.ts` is the model: drive both sides over one database and
compare. ringo's data endpoints (`/spawnloop/rfcs`, `/spawnloop/backlog`)
return the rows its script renders, so the comparison can be made against
JSON rather than by diffing HTML — compare the ordered id lists and the
counts, not the markup, since #7 deliberately diverges on markup.

## Acceptance criteria

- A gate compares `/rfcs` and `/backlog` against ringo's data for every tab,
  over the full database, and fails on any difference in membership, order or
  counts.
- Markup divergence (the #7 status vocabulary) does not fail the gate.
- It runs in CI beside `pnpm gate`.
