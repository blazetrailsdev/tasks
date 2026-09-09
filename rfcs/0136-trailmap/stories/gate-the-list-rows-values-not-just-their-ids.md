---
title: "The list gate compares ids and counts, never what a row says — inherited priority and packages are unchecked"
status: done
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 4
pr: 20
claim: "2026-09-09T15:00:55Z"
assignee: "deployed-rfcs-index-500s-with-connectionnotdefined"
blocked-by: null
closed-reason: null
---

## Context

`pnpm gate:lists` compares `/rfcs` and `/backlog` against ringo on MEMBERSHIP,
ORDER and the TAB COUNTS — it pulls the ids out of each side's row anchors and
diffs the sequences. That is the story's criterion and it holds the port's
skeleton still. It says nothing about what each row SAYS.

ringo's backlog row carries labels the port also renders: the queue position
(`next up` / `#N in queue`), the effective priority with its inherited `*`,
the effective packages with theirs, the over-LOC flag against `max_loc`, the
cluster, and the icebox tag (`vendor/ringo/backlog-draw.js`, the `labels`
assembly). The RFC row carries `story_done/story_total`, the priority `P<n>`
and the clusters. A port that listed exactly the right stories in exactly the
right order while inheriting the wrong RFC's priority onto a row would pass the
gate as it stands.

The inherited-priority and inherited-packages rules are the ones worth
covering: they are own-then-parent fallbacks, they are what the queue ranks by,
and #15 ported them from the same script that this gate already executes.

## Expected shape

Extract a small record per row from both sides rather than just the id, and
diff those. The two vocabularies differ deliberately (#7), so compare the
VALUES — position, priority and whether it is inherited, packages, est-loc,
icebox — not the label markup, the same way `page-extract.ts` does for the show
pages.

## Acceptance criteria

- The gate compares each row's values, per tab, over the full database.
- The #7 status vocabulary and the tabs-as-links change still do not fail it.
- A deliberate change to the inherited-priority rule turns the gate red.
