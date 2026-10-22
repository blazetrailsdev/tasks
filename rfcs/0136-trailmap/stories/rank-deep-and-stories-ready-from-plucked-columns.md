---
title: "trailmap: /up/deep and GET /stories/ready stall the process ~0.7s loading every story as a record"
status: done
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#74
claim: "2026-10-22T01:37:01Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

## Context

Measured in trailmap#63 (2026-10-12, 12,682 stories): `Story.rankingIndex()`
plus `Story.claimable()` takes 0.7s warm, of which about 0.53s is one query,
`Story.all().toArray()`, and the other five queries total 0.1s. SQLite is
synchronous here, so nothing else is served for that time. `/up/deep` is now
single-flight and bounded (docs/deploy.md, "What bounds /up/deep"), but each
run still costs the stall, and `GET /stories/ready`
(`app/controllers/stories-controller.ts`, `ready`) runs the same ranking with
neither protection.

`/backlog` already ranks from `Story.rankingOutline()` (four plucked columns,
0.1s for the same six queries) and loads records only for the rows it shows.

## Acceptance criteria

- [ ] `GET /stories/ready` and `next-bundle` rank from the outline and load records only for the rows they answer with; `pnpm gate` stays byte-identical
- [ ] `/up/deep` measures the same path the API serves
- [ ] The before/after stall is recorded in docs/deploy.md
