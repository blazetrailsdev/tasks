---
title: "Burn down actionpack naming-shape debt and enroll it in the gate"
status: draft
updated: 2026-10-26
rfc: "0208-predicate-and-underscore-naming"
cluster: cross-package-burndown
packages: ["actionpack"]
deps: ["naming-shape-merge-base-gate"]
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

The RFC audit's coarse count (2026-10-26) is 123 TS-public untagged `_` declarations in `packages/actionpack/src`, before the Rails/ivar split, plus 17 `_setX` slot setters (CLAUDE.md says no slot instance remains, so check these). Cut the work from `pnpm parity:api:naming-shape --list actionpack`. If the rows exceed one PR, ship a slice and file the rest.

## Acceptance criteria

- [ ] `--list actionpack` debt dimensions reach 0, or the remainder is filed as new stories.
- [ ] `actionpack` is added to `ENROLLED` in the gate.
