---
title: "trailmap: show ready stories held on unfinished deps as blocked, as ringo does"
status: ready
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards
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

Since btwhooks `6a18453` ringo repaints, for DISPLAY, every `ready` story the
queue is holding back on unfinished deps as `blocked` (`markDepBlocked`,
`webhook/depblocked.go`), and carries what it waits on. The authored status
stays `ready`. Its `/rfcs` bar, `/backlog` and RFC story lists all read that.

trailmap does not port it. `claimableIn` (`app/models/concerns/ranking.ts`)
already knows which `ready` stories are dep-held — it drops them from the
queue — but every page still shows them as `ready`.

Found by `gate-the-rfcs-progress-bar-against-ringo`: over the live database
the `/rfcs` bar agreed with ringo's `story_status` on 179 of 188 RFCs, and the
other 9 differed only by stories ringo counts `blocked` and trailmap `ready`.
`compareBars` (`scripts/page-equivalence.ts`) therefore compares `ready` and
`blocked` as one folded count, and says so.

## Acceptance criteria

- [ ] A `ready` story with an unfinished dep (story or RFC) is shown as `blocked` wherever trailmap shows a story status, by one rule beside `effectiveStoryStatus`, not per page.
- [ ] `compareBars` compares `ready` and `blocked` separately and `pnpm gate:pages` is green on the bar.
- [ ] The vendored ringo pin moves to a commit that has `markDepBlocked`, so `gate:lists` sees the same rule.
