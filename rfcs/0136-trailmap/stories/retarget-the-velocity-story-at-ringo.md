---
title: "point-velocity-at-the-events-table is ringo work: retarget it at btwhooks, where TASKS_EVENTS_SOURCE already exists"
status: claimed
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-10-22T19:58:09Z"
assignee: "drop-the-redundant-tasks-mount"
blocked-by: null
closed-reason: null
---

## Context

`point-velocity-at-the-events-table` was claimed in a trailmap bundle
(trailmap#68) and released, because none of its work is in trailmap.

`/graphs/velocity` is ringo's page: `webhook/velocity.go` and
`webhook/velocity_page.go` in btwhooks, routed in `main.go`. trailmap serves no
velocity chart and nothing in it parses commit subjects. trailmap's half
already exists: `GET /events` (`ReadModelsController#events`) serves the
`events` table.

ringo's half is mostly built too. `webhook/taskevents.go` has a
`TASKS_EVENTS_SOURCE` switch (`git` | `db` | `json` | `auto`) that DEFAULTS TO
`git`, and the non-git paths synthesize commit subjects so the one parser runs
unchanged. So what is left is: flip the source, compare the weekly figures
before and after, and then decide whether the subject-synthesis layer goes.

btwhooks has no GitHub remote, so this cannot be a PR a trailmap or trails
worker opens, and a spawn-loop worker will bounce off it again.

## Acceptance criteria

- `point-velocity-at-the-events-table` says in its prose that the change is in
  btwhooks, names `webhook/taskevents.go` and `TASKS_EVENTS_SOURCE`, and is
  kept out of the trailmap spawn queue (or is closed in favour of a story
  tracked wherever ringo work is tracked).
- Its acceptance criterion "reads the events table through the API" is
  reconciled with ringo's existing `db` source, which reads `tasks.db`
  directly rather than calling trailmap.
