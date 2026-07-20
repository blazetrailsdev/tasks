---
title: "Per-entry verify the cluster-vetted value-accessor-read wide-call entries"
status: ready
updated: 2026-07-20
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4997 replaced the shared bulk reason on the 181 wide-call exclude entries
surfaced by #4656 with per-cluster reasons (mutex, constructor idiom,
core/Enumerable idiom, Rack header accessors, value-accessor read). Those
reasons state their own vetting level honestly: representative entries per
cluster were read against the vendored Rails body, the remainder were
classified by shared mechanism and NOT line-diffed individually.

That extrapolation is unproven. The one entry #4997 did examine closely
(`metal/mime-responds.ts any_response?`) turned out to hide three distinct
divergences — `any_response?` itself, `Collector#any` arg dispatch, and
`custom` first-wins — none visible from the call name alone.

## Acceptance criteria

- Per-entry verification of the two largest clusters (value-accessor read,
  core/Enumerable idiom) against the vendored Rails body.
- Each verified entry gets a reason citing the Rails `file:line` it was
  checked against, replacing the cluster-level wording.
- Real omissions found get their own stories (or fixes, if under the ceiling).
- `pnpm api:calls:wide` green; baseline only shrinks.
