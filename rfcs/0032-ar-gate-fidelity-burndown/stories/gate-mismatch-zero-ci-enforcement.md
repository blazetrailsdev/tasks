---
title: "Arm hard-zero CI gate on activerecord gate-mismatch count"
status: done
updated: 2026-07-24
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
priority: 30
pr: 5238
claim: "2026-07-24T16:46:53Z"
assignee: "gate-mismatch-zero-ci-enforcement"
blocked-by: null
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
