---
title: "Pin actionpack's 216 unpinned method bodies"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
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

`pnpm parity:api` on trails `main` @ `87094a5097` reports body-pin coverage of actiondispatch 1269/1411 (142 unpinned), actioncontroller 445/509 (64), abstractcontroller 78/87 (9) and actionpackversion 1/2 (1). Arel, activemodel, bcrypt, rack-session and sqlite3 are fully pinned. An unpinned matched pair is invisible to the DRIFT check in `scripts/api-compare/lint-body-pins.ts`, so an upstream Rails body change to one of these 216 methods would go unnoticed.

## Acceptance criteria

- Spot-check each unpinned pair's TS body against its Rails body before pinning. Then pin each Ruby file with `pnpm tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`, not `--pin-all` over the whole repo.
- All four actionpack packages report `0 unpinned`, and `pnpm parity:api:pins` passes.
- Any pair whose body is not a faithful port is left unpinned and filed as a story.
