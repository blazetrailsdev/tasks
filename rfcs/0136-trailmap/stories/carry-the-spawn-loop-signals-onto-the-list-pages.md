---
title: "Decide the fate of the four ringo list-page signals the port dropped"
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

PR #15 ported the two list pages and deliberately dropped four signals, each
because the data behind it is ringo's own local state and is not in the tasks
database. That is the right call for a read port and the wrong end state for
`retire-the-go-read-model`: when ringo's pages go, these go with them unless
something here replaces them.

What is missing, and what stands behind each:

- **"needs refine"** on the RFC list — no ready stories left and nothing in
  flight, so an auto-refine agent is due. ringo asks its own spawn trigger
  (`stalledActiveRFCs`, `webhook/rfcs.go:124`) rather than re-deriving the
  rule, which is exactly the right instinct and exactly why it cannot be
  copied: the rule lives in the loop, not in the data.
- **The over-LOC label** on the backlog — `~N LOC` marked when a story exceeds
  the spawn ceiling. The ceiling is `sl.cfg.MaxLOC`, ringo's configuration.
- **Loop running / paused** — `sl.cfg.Enabled`, the same.
- **Bar history ticks** on the RFC list — where an RFC's story count stood
  when it was written and at each refinement, from a cache over ringo's event
  stream (`webhook/rfcs.go` `marks`). trailmap HAS the event stream now
  (`events` table, `point-velocity-at-the-events-table`), so this one is
  reconstructible here in a way the other three are not.

The interesting question this story has to answer first: which of these are
facts about the WORK (belong in trailmap) and which are facts about the LOOP
(belong wherever the loop ends up)? A stalled RFC is arguably the former — it
is a property of the story set, and trailmap can compute "active RFC, no
claimable stories, none in flight" from `Story.claimable()` and status counts
without knowing anything about spawning. The LOC ceiling and the enabled flag
are plainly the latter, and probably want a config surface rather than a
guess.

Depends on nothing technically, but it is only worth doing before
`retire-the-go-read-model` lands.

## Acceptance criteria

- Each of the four signals is either implemented in trailmap or recorded as
  deliberately not carried, with the reason.
- Any signal that is a property of the story set is computed from the models,
  not re-derived from a copy of the loop's rule.
- Any signal that needs the loop's configuration reads it from a named source
  rather than a hardcoded number.
