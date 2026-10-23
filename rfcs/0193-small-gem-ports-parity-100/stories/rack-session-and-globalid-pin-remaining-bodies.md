---
title: "rack-session and globalid: re-pin the 6 bodies that drifted unpinned"
status: ready
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: ["rack-session", "globalid"]
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

`API_COMPARE_FORCE=1 pnpm parity:api --calls` on main @ `ee595ccb75` reports

- `rack-session — pins: 78/82 (4 unpinned)`
- `globalid — pins: 66/68 (2 unpinned)`

every other package in RFC 0193 is at 0 unpinned. `rack-session-pin-cookie-and-encryptor-bodies`
and `rack-pin-unpinned-bodies` are both `done`, so these 6 are drift that
landed after those stories: a body pin goes stale when the ported method is
edited or moved, and nothing re-pins it automatically.

RFC 0193's Verification clause asks for "methods, files, inheritance, arity and
params at 100%, with pins 0 unpinned" for each package, so this is the last
pin gap in the RFC.

A pin records that the TS body was verified against a specific Rails/gem body,
so re-pinning is not mechanical: each of the 6 is read against its upstream
counterpart first, and a divergence found while re-reading is converged (or
filed) rather than pinned over.

## Converged shape

`parity:api` reports `pins: 82/82` for rack-session and `68/68` for globalid,
each pin written after its TS body was read against the gem body it mirrors.

## Acceptance criteria

- [ ] Identify the 6 with `pnpm parity:api --package rack-session` /
      `--package globalid` (the unpinned members are listed in the per-file
      detail).
- [ ] Read each TS body against its counterpart under
      `vendor/rack-session/v2.1.0/lib/rack/session/` or
      `vendor/globalid/v1.3.0/lib/global_id/` before pinning.
- [ ] Any divergence found is converged in this PR if it fits, else filed with
      the `file:line` in hand — a pin is not a way to bless a divergence.
- [ ] Both packages report 0 unpinned.
