---
title: "Burn down trailties naming-shape debt and enroll it in the gate"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: cross-package-burndown
packages: ["trailties"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit's coarse count (`audits/predicates-underscores-20261026T164305Z.md`) is 19 TS-public untagged `_` declarations in `packages/trailties/src`, before the Rails/ivar split. Cut the work from `pnpm parity:api:naming-shape --list trailties`. If the rows exceed one PR, ship a slice and file the rest.

## Acceptance criteria

- [ ] `--list trailties` debt dimensions reach 0, or the remainder is filed as new stories.
- [ ] `trailties` is added to `ENROLLED` in the gate.
