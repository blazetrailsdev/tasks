---
title: "Serve the task-domain /spawnloop/* reads as JSON, gated against ringo"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo's own dashboard JavaScript calls a family of `/spawnloop/*` read
endpoints — `/spawnloop/rfcs`, `/spawnloop/backlog`, `/spawnloop/config`,
`/spawnloop/crons`, `/spawnloop/velocity`, `/spawnloop/velocity/week`,
`/spawnloop/cost`, `/spawnloop/parity`, `/spawnloop/grades`,
`/spawnloop/audits` — served from `webhook/spawnloop.go`. RFC 0136 already
replaced the two list pages those JS shells backed, but the endpoints
themselves are still the interface anything else consumes.

Phase B: trailmap serves the task-domain ones as JSON so a consumer can be
pointed at either process and get identical bytes. That is what makes the
phase F deletion provable rather than hopeful.

## Acceptance criteria

- The task-domain endpoints (`rfcs`, `backlog`, `config`, `crons`, `velocity`,
  `velocity/week`) are served by trailmap with byte-identical JSON to ringo's,
  over the live database.
- The `stats.db`-backed ones (`cost`, `parity`, `grades`) are explicitly out of
  scope and stay Go-only; say so in the PR.
- A gate script diffs both processes' output for every endpoint in scope and
  fails on any difference.
- Nothing in ringo changes.
