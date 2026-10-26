---
title: "Burn down ruby-compat naming-shape debt and enroll it in the gate"
status: draft
updated: 2026-10-26
rfc: "0208-predicate-and-underscore-naming"
cluster: cross-package-burndown
packages: ["ruby-compat"]
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

The RFC audit's coarse count (2026-10-26) is 8 TS-public untagged `_` declarations in `packages/ruby-compat/src`, before the Rails/ivar split. Cut the work from `pnpm parity:api:naming-shape --list ruby-compat`. If the rows exceed one PR, ship a slice and file the rest.

## Acceptance criteria

- [ ] `--list ruby-compat` debt dimensions reach 0, or the remainder is filed as new stories.
- [ ] `ruby-compat` is added to `ENROLLED` in the gate.
