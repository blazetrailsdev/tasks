---
title: "Gate the /rfcs progress bar — the one row value no gate compares"
status: draft
updated: 2026-09-09
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

`/rfcs` draws a progress bar per RFC — one segment per story status, widths
from `storyStatusCounts` (`app/models/concerns/rfc-progress.ts`). It is the
only place on that page where a STORY status is stated, and after
`one-status-vocabulary-across-trailmaps-own-pages` (trailmap#22) it states the
EFFECTIVE status: `storyStatusCounts` takes the parent RFC's status, so a
`ready` story under a draft RFC sits in the draft segment.

Nothing proves ringo agrees.

`pnpm gate:lists` compares membership, order, tab counts and row values, and
the bar is not among them. It cannot be: `ringoRfcs`
(`scripts/gate-ringo-lists.ts`) assembles ringo's rows from the RFC columns
plus the vendored Go `rfcStoryCounts`, and passes no `story_status` — the map
ringo's own server computes and `vendor/ringo/rfcs-draw.js:206` draws from. So
ringo's side of the gate paints no segments at all. Its markup would not be
readable by `page-extract.ts` anyway: ringo's segments are `<i class="ready">`,
not a badge or a label, so the `s-` skip in `labelsOf` never saw them.

trailmap#22 documented the hole rather than closed it —
`RfcListRow` in `scripts/page-extract.ts` and the header of
`scripts/gate-ringo-lists.ts` both now say the bar is uncompared and why. This
story closes it.

The `done/total` headline beside the bar IS compared (`RfcListRow.progress`)
and is invariant under the override, since `ready` and `draft` are both `open`
to `rfcStoryCounts` — so the uncovered surface is exactly the segment split.

## Why it matters

It is the one row value where trailmap knowingly makes a semantic choice that
may differ from ringo's, which is precisely the kind of divergence the gates
exist to hold still. Today a regression in `storyStatusCounts` — dropping the
`rfcStatus` argument, say — would turn no gate red.

## Shape expected

The bar needs ringo's `story_status`, which only ringo's server has, so this
belongs to the live-ringo gate (`pnpm gate:pages`, `scripts/page-equivalence.ts`)
rather than to `gate:lists`, whose whole design is that it runs ringo's
scripts offline over vendored code.

Two routes worth weighing in the story rather than deciding here:

1. Extract the segments from a LIVE `/rfcs` (`<i class="<status>">` with a
   `title` of `<count> <status>`) and compare them to trailmap's `seg s-*`.
   Proves the real thing; needs `RINGO_BASE`, so it does not run in CI.
2. Have `scripts/vendor-ringo.sh` also vendor whatever builds `story_status`
   on ringo's side, the way `counts.go` already vendors `rfcStoryCounts`, and
   feed it in `ringoRfcs` so `gate:lists` can paint the bar offline. Larger,
   but it lands in CI, which is where the other list gates already are.

Either way the answer settles a question trailmap#22 could only record as
unknown: whether ringo's `story_status` is authored or effective.

## Acceptance criteria

- A gate compares the `/rfcs` bar's segments — status and count per RFC —
  against ringo's, over the live database.
- The comparison is red when `storyStatusCounts` is given the wrong RFC status,
  proven by a self-test arm like `gate:lists --self-test=values`.
- If ringo turns out to carry the AUTHORED status, the divergence is stated in
  the gate and in `app/views/shared/_status-badge` rather than silently
  tolerated — trailmap#22's rule stands, it just becomes a known difference.
- The "uncompared" notes in `scripts/page-extract.ts` (`RfcListRow`) and the
  header of `scripts/gate-ringo-lists.ts` are updated or removed to match.
