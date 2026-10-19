---
title: "Enroll actioncontroller and abstractcontroller in the naming gate"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  - naming-residue-burndown-actioncontroller
  - naming-residue-burndown-actiondispatch
  - naming-residue-burndown-actioncontroller-remainder
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9081
claim: "2026-10-19T17:28:32Z"
assignee: "enroll-actionpack-in-naming-gate"
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

- actioncontroller and abstractcontroller are in `NAMING_ENROLLED_PACKAGES`
  and `pnpm parity:api:calls:args` is green.
- actiondispatch's permanent pairs carry `@missingRailsName` receipts; its one
  convergeable row and its enrollment are `enroll-actiondispatch-in-naming-gate`.
