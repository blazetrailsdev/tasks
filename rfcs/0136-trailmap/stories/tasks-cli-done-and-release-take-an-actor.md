---
title: "tasks CLI: done and release cannot record who made the mutation"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ringo-records-every-cron-run-as-an-event` is blocked: it needs "mutations a sweep makes carry the sweep as their actor". ringo's merge sweep and claim sweep shell out to `tasks done` and `tasks release` (btwebooks `webhook/mergesweep.go:152`, `webhook/claimsweep.go:263`), and the CLI records those events with `actor: null` (tasks `src/verbs.ts:50`, `extra.actor ?? null`). There is no flag or environment variable that sets it. Only `claim` (`--assignee`) and `record-spawn` (`--source`) carry an actor.

## Acceptance criteria

- `tasks done` and `tasks release` take `--actor NAME` (or honour a `TASKS_ACTOR` env var), and write it to the `events` row.
- Tests in the tasks repo cover both verbs with and without it.
- Unblock `ringo-records-every-cron-run-as-an-event` once it lands.
