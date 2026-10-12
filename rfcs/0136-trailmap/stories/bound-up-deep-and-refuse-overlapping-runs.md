---
title: "Bound /up/deep and refuse overlapping runs: it stalls every other request while it ranks"
status: ready
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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
