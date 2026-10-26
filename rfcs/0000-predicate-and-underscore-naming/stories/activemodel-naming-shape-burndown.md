---
title: "Burn down activemodel naming-shape debt and enroll it in the gate"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: cross-package-burndown
packages: ["activemodel"]
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

The audit's coarse count (`audits/predicates-underscores-20261026T164305Z.md`) is 43 TS-public untagged `_` declarations in `packages/activemodel/src`, before the Rails/ivar split. Cut the work from `pnpm parity:api:naming-shape --list activemodel`. If the rows exceed one PR, ship a slice and file the rest.

## Acceptance criteria

- [ ] `--list activemodel` debt dimensions reach 0, or the remainder is filed as new stories.
- [ ] `activemodel` is added to `ENROLLED` in the gate.
