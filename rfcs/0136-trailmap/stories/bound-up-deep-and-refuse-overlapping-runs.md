---
title: "Bound /up/deep and refuse overlapping runs: it stalls every other request while it ranks"
status: in-progress
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#63
claim: "2026-10-12T16:01:33Z"
assignee: "backlog-rows-overflow-a-phone-screen"
blocked-by: null
closed-reason: null
---

## Context

`ProbesController#deep` (trailmap `app/controllers/probes-controller.ts`, trailmap#54) computes the ready queue with `Story.rankingIndex()` and `Story.claimable()` and has no upper bound on how long it runs.

Measured live against the 12.6k-story database: one `/up/deep` takes about 1.3s, and for that time every other request the process serves waits, because SQLite here is synchronous and the ranking is CPU on the one thread. Eight concurrent `deep` requests held `/up/ready` for 8.4s (still 200). The same cost applies to `GET /stories/ready`, which runs the same ranking (`app/controllers/stories-controller.ts`, `ready`).

Today the only protection is prose in `docs/deploy.md` ("never in parallel"). SQLite's 5s busy timeout bounds a locked database but nothing bounds a slow ranking, and nothing stops two canaries overlapping.

## Acceptance criteria

- [ ] `/up/deep` answers 503 naming a timeout once the queue takes longer than a stated bound, instead of holding the caller
- [ ] A second `/up/deep` arriving while one is in flight is refused or shares the first one's result, so overlapping canaries cannot stack
- [ ] The bound is documented with the measurement it was chosen from
- [ ] Decide, and record in the story, whether the ranking should yield to the event loop between its six queries; if that is a trails limitation, file it there

## Decision: the ranking does not yield between its six queries

Recorded from trailmap#63, measured 2026-10-12 against the live database
(12,682 stories, 144 in the queue). One ranking is 0.7s warm and 1.1–1.3s cold.
About 0.53s of that is ONE query — loading every story as a record — and the
other five total 0.1s. A timer started beside the ranking never fired: SQLite
is synchronous here, so the `await`s never return to the event loop.

Yielding between the queries would therefore still stall the process for half
a second at a stretch, so it was not done. It is not filed against trails: the
cost is that one load, not a limit of the framework. What stops canaries
stacking is the single-flight (`ProbesController#sharedQueue`); the 5s bound
answers 503 but cannot interrupt a ranking in progress. The cheaper ranking,
should `deep` ever need one, is `Story.rankingOutline` (0.1s, plucked columns).
