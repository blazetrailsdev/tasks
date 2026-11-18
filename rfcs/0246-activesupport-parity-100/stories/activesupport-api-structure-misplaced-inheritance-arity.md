---
title: "activesupport: fix misplaced files, inheritance and arity mismatches"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
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

`parity:api` reports 3 misplaced files, inheritance at 87/100 and arity at
1487/1491. `activesupport-parity-baseline-remeasure` lists them by name.

## Acceptance criteria

- [ ] Move the misplaced files to their Rails-mirrored paths.
- [ ] Fix the 13 inheritance mismatches and 4 arity mismatches, or receipt
      them.
- [ ] `parity:api` shows misplaced 0, inheritance 100% and arity 100%.
