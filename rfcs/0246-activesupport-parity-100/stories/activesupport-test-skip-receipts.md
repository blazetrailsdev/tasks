---
title: "activesupport: receipt or port the 56 skips, wrong describes and mismatches"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:test` shows 56 skips across 28 activesupport files. Under the RFC
0246 definition of 100%, every skip carries a `PERMANENT-SKIP:` line that
cites a ratified section.

## Acceptance criteria

- [ ] For each skip: port it, or add `PERMANENT-SKIP:` that cites a section.
      If no section fits, list it in the PR for an operator ruling.
- [ ] Fix the 5 wrong-describe rows in `share-lock.test.ts` and the 4
      assertion mismatches (`pnpm parity:test:assertions`).
- [ ] Resolve the ✗ `concurrency/load_interlock_aware_monitor_test.rb`.
