---
title: "Seed the body-pins whole-surface floor at first release"
status: claimed
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-24T19:58:53Z"
assignee: "body-pins-seed-floor-at-release"
blocked-by: null
closed-reason: null
---

## Context

PR #5209 (story body-pins-establish-baseline-floor) established the body-pins
policy as ORGANIC UNTIL FIRST RELEASE and deferred the whole-surface `--pin-all`
floor, per the user's decision not to pin before a release. `body-pins.json`
therefore ships empty; the `Body-pins gate` reports `OK (0 pinned)` and detects
no drift on `vendor/rails` bumps until pins exist.

At the first release, seed the floor so a later Rails bump surfaces every
changed body. Mechanism already built:

- `pnpm api:pins:all` — `API_COMPARE_FORCE=1 pnpm api:compare` then
  `body-pins.ts --pin-all`, pinning every matched pair at the released digest.
- policy + workflow documented in CONTRIBUTING.md "Body pins".

This is a generated-manifest PR (~9k entries, ~55k JSON lines) — mechanical, not
subject to the usual LOC ceiling in spirit but note it is NOT a lockfile/snapshot
exemption. Run at release time only.

## Acceptance criteria

- [ ] `pnpm api:pins:all` run at the release commit; `body-pins.json` committed
      with the whole-surface floor.
- [ ] `pnpm api:pins` green (`body-pins gate: OK (N pinned)`).
- [ ] Floor pins carry no `reason`; any organic pins already present keep theirs.
