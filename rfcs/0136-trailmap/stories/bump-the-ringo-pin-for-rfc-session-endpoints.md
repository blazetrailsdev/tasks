---
title: "Deploy ringo's RFC session and rfc-spawns endpoints and bump the vendored ringo pin"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - ringo-rfc-discussion-sessions
  - ringo-reports-in-flight-rfc-refines
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rfc-page-discussion-session-tab` needs ringo's `/rfc-session/*` and
`/api/rfc-spawns` endpoints (`0000-ringo-changes`). Merging them in btwebooks
does not make them reachable from trailmap: ringo has to be deployed, and
trailmap's `vendor/ringo/PIN` bumped in its own PR so a gate that goes red can
be reverted alone (as in `bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards`).

## Acceptance criteria

- ringo deployed at a commit carrying both ringo stories; `GET
/rfc-session/status?slug=<any rfc>` and `GET /api/rfc-spawns?slug=<any rfc>`
  answer 200 through `Setting.ringoBase()` on the deployed trailmap.
- `vendor/ringo/PIN` bumped to that commit in a PR with no application
  changes; `pnpm gate:parity --fixture` and `pnpm gate:lists` pass on it.
