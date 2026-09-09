---
title: "Run the equivalence gates against the live pair"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["record-smoke-runs-in-a-table"]
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The CI `gate` job rebuilds a database — check out the content repo, migrate,
ingest, point both sides at one file, "One snapshot, by construction" — and
runs ringo's own code from `vendor/ringo`, a pinned copy, "because btwhooks has
no remote to check out". `scripts/ringo-pin.ts` and a dedicated story exist to
notice when that snapshot drifts from the ringo that is actually serving.

On the box, both processes are running against the same live database. The gate
wants that pair, not a reconstruction of it. Running it there also measures
phase C's exit criterion over real data volume, including the rows a rebuilt
database never contains.

## Acceptance criteria

- [ ] Tier 4 runs the page, list and markdown gates against the running ringo
      and the running trailmap, hourly, over the whole database
- [ ] Each gate keeps its `--self-test`, run against the live pair, so a gate
      that has stopped looking goes red
- [ ] A divergence records which page and which rows differed, not just a count
- [ ] The gates take no vendored ringo snapshot on this path
- [ ] Runtime is bounded so an hourly gate cannot overlap itself

## Verification

The tier reports green over the full live database, and a deliberate
one-character change to a renderer turns it red naming the page.
