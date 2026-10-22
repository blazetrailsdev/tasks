---
title: "Move each deploy log off ringo's disk so /deploys/log works without ringo"
status: draft
updated: 2026-10-22
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

trailmap#77 serves `/deploys/log` by relaying ringo, because each run's log is
the tmux pipe-pane capture written to ringo's disk (`DeployRun.LogFile`,
webhook/deploys.go:83, read by `LogText`).
`move-deploys-and-sweeps-into-the-database` moves the run history into a table
but not these logs, so after it lands the log route still depends on ringo,
and so does the phase-F move.

## Acceptance criteria

- Pick a home for the logs that trailmap can read without going through ringo:
  a shared volume, or a `deploy_logs` table filled when a run finishes, with
  the tail streamed while it is running.
- Record the choice in the 0136 RFC.
- `DeploysController#log` (app/controllers/deploys-controller.ts) reads from
  that home.
- Logs of runs already finished are backfilled.
