---
title: "Establish body-pins baseline (floor policy + populate body-pins.json)"
status: draft
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

PR #4388 (story api-compare-rails-body-hash-pinning, RFC 0025) shipped the
source-hash pinning MECHANISM but `scripts/api-compare/body-pins.json` ships
EMPTY, so the `Body-pins gate` CI job is a no-op today (0 pinned / ~9,147
matched pairs). The tool only earns value once pins exist: a pinned pair is a
recorded claim that a human verified the TS port matches that exact vendored
Rails body, and the gate then reports DRIFT (pinned digest != current) on the
next `vendor/rails` bump and STALE on removal/rename.

Two population paths are already built (see body-pins.ts header):

- per-cluster: `tsx scripts/api-compare/body-pins.ts --pin <ruby-file>` as the
  last step of a convergence/port story once the port is verified faithful;
- bulk floor: `--pin-all` pins every matched pair at the current digest — a
  weaker claim (a green name-match gets pinned alongside a verified port) but a
  legitimate baseline since the current vendored tree is the de-facto baseline.

Decision to make + work to do:

1. Choose the floor policy: seed `--pin-all` now (immediate whole-surface drift
   detection, weak per-method claim) vs. grow pins only via convergence stories
   (strong claims, slow coverage). A hybrid — `--pin-all` floor now, upgrade
   `reason` per pair as convergence stories verify them — is likely best.
2. If seeding the floor: commit the generated body-pins.json (~9k entries; note
   it is NOT a docs/snapshot/lockfile exemption, so it counts against LOC — a
   generated-manifest PR, mechanical) and confirm the gate stays green.
3. Wire the pin step into the convergence-story checklist so future ports pin
   as they land (doc/CLAUDE.md note or story-template line).

## Acceptance criteria

- [ ] Floor policy decided and recorded (all-pin floor vs organic-only vs hybrid).
- [ ] body-pins.json populated per the chosen policy; `pnpm api:pins` green in CI.
- [ ] Convergence workflow references the `--pin <file>` step so new/re-verified
      ports get pinned going forward.
