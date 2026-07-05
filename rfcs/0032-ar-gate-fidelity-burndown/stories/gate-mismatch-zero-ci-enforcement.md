---
title: "Arm hard-zero CI gate on activerecord gate-mismatch count"
status: blocked
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: enforcement
deps:
  [
    "gate-missing-gate-burndown",
    "gate-wrong-gate-burndown",
    "gate-over-gated-burndown",
    "gate-should-gate-burndown",
  ]
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: "2026-06-20T16:49:38Z"
assignee: "gate-mismatch-zero-ci-enforcement"
blocked-by: "Precondition unmet: activerecord gate-mismatch count is 17 (16 wrong-gate + 1 should-gate), not zero, despite the four burndown deps being marked done. Arming the hard-zero --check gate now turns CI red immediately, which the story forbids ('do not arm before they read zero'). Residual wrong-gate tests: changing columns; changing column null with default; default functions on columns; upsert all works with partitioned indexes; advisory locks enabled?; schema dump expression indices escaping; partial insert off with changed composite identity primary key attribute; migrate revert add check constraint with invalid option; passing arbitrary flags to adapter; passing flags by array to adapter; insert record; insert record populates primary key; read uncommitted; read committed; repeatable read; serializable. should-gate: doesnt error when a select query has encoding errors. The --check mechanism is implemented (test-compare.ts --gates --check) and ready to wire once these converge to zero."
---

## Context

RFC `ar-gate-fidelity-burndown`, cluster `enforcement`. After the four burndown
clusters (`missing-gate`, `wrong-gate`, `over-gated`, `should-gate`) reach zero,
lock it in: today there is **no CI gate** on the activerecord gate-mismatch
count, so it can silently regrow. Per the RFC's chosen rollout this is a **hard
zero gate with no exclude-list / baseline** — armed only once the count is
already zero.

## Acceptance criteria

- [ ] CI fails when the `activerecord` gate-mismatch count from
      `test:compare --package activerecord --gates --json` is non-zero.
- [ ] No seeded exclude-list or baseline ratchet (hard zero).
- [ ] Mechanism decided in this story: either extend
      `scripts/test-compare/gate-mismatch.test.ts` to assert a zero count from
      `convention-comparison.json`, or add a `test:compare --gates --check`
      exit-code path wired into CI. Document the choice.
- [ ] Gate is wired into the same CI lane that runs `test:compare` today.

## Notes

Sequenced **last** — `deps` on the four burndown stories. Do not arm before they
read zero or CI goes red. Confirm the chosen check reads the per-package count
(activerecord only; other packages are out of scope for this RFC).
