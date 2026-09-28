---
title: "Gate actionpack in the assertion-mismatch ratchet"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: ["triage-actionpack-assertion-mismatches"]
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

`pnpm parity:test:assertions` gates only the AR require closure (activemodel,
activerecord, activesupport, date, globalid and the packages already at zero).
actionpack's marks are recorded but not gated, so a new port can regress an
assertion without a red. Enrolling is safe once the triage's burn-down stories
have landed and the marks are at their floor.

## Acceptance criteria

- actiondispatch, actioncontroller and abstractcontroller are gated by
  `pnpm parity:test:assertions` at their measured (only-shrink) marks, with the
  measured values recorded in the PR.
- The gate is green on `main`.
