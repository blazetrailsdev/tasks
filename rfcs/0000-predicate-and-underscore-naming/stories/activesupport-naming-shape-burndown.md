---
title: "Burn down activesupport naming-shape debt and enroll it in the gate"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: cross-package-burndown
packages: ["activesupport"]
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

The RFC audit's coarse count (2026-10-26) is 36 TS-public untagged `_` declarations in `packages/activesupport/src`, before the Rails/ivar split, plus 23 quoted predicates (Logger / Inquirer; keep the sanctioned ones). Cut the work from `pnpm parity:api:naming-shape --list activesupport`. If the rows exceed one PR, ship a slice and file the rest.

## Acceptance criteria

- [ ] `--list activesupport` debt dimensions reach 0, or the remainder is filed as new stories.
- [ ] `activesupport` is added to `ENROLLED` in the gate.
