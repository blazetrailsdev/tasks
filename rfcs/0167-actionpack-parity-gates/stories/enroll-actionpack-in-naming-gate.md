---
title: "Enroll actiondispatch, actioncontroller and abstractcontroller in the naming gate"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: ["naming-residue-burndown-actioncontroller", "naming-residue-burndown-actiondispatch"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:105`) is
only-grow (RFC 0153). Once the two burn-down stories land, actionpack's naming
residue is zero and the three packages can join, so a new mis-spelled
identifier reds `pnpm parity:api:calls:args` instead of accumulating.
abstractcontroller had one burndown row on 2026-09-27; confirm it is gone.

## Acceptance criteria

- The three packages are in `NAMING_ENROLLED_PACKAGES` and
  `pnpm parity:api:calls:args` is green.
- CLAUDE.md's sentence that "the actionpack family … remain report-only" is
  updated to match.
