---
title: "Add the assertion-mismatch ratchet to the pre-PR checklist"
status: draft
updated: 2026-09-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md's "Before you open the PR" section enumerates the `parity:*` gates
and the ESLint manifest rules, but says nothing about
`scripts/test-compare/lint-assertion-mismatches.ts`, which CI runs as its own
step in the `Rails API/Test Comparison` job.

That gate is only-shrink over
`scripts/test-compare/assertion-mismatch-mark.json`: it fails when a
name-matched test asserts a different NUMBER, KIND, or VALUE of things than its
Rails counterpart.

The omission has a cost, paid in PR #7395. That PR retired
`UNPORTED_FILES` rows naming Rails tests the port already had. Retiring a row
does not just move `parity:test`'s matched count — it makes a Rails test PAIR
with a TS test that was previously scored `extra (TS only)`, and the assertion
comparison then runs on a pair it never ran on before. One row moved:

```text
globalid  assertion-kind-mismatch: 28 (mark 27, +1)
```

The author had run every gate the checklist names (`parity:api:calls`,
`:calls:args`, `:extra:gate`, `:params`, `pnpm lint`, `pnpm typecheck`) plus
`parity:test`, and all were green; the red arrived from CI, costing a round.
The class generalises: **any** change to `scripts/parity/unported-files/` can
move assertion-level debt without moving a single gate named in the checklist.

## Converged shape

Add a step to CLAUDE.md's "Before you open the PR" list, next to the existing
`parity:test` item:

- name `pnpm exec tsx scripts/test-compare/lint-assertion-mismatches.ts`
  (`--no-regen` as CI runs it), and say it must be run after any change to
  `scripts/parity/unported-files/` or to a `*.test.ts` that mirrors a Rails
  test file;
- state the only-shrink contract and that the mark is never raised to admit new
  debt — the remedy is to converge the port's assertions, or to keep the Rails
  test excluded with a reason if its assertion is genuinely unreachable
  (`liveTsCounterpart`, added in #7395, is the receipt for the sub-case where a
  live TS test shares the excluded Rails test's name).

Sibling story: `add-eslint-exclude-baseline-generators-to-pre-pr-checklist`
edits the same section for the two generated ESLint baselines; these can ship
together.

## Acceptance criteria

- [ ] CLAUDE.md's "Before you open the PR" section names the assertion-mismatch
      gate, its trigger, and its only-shrink contract.
- [ ] No script or doc gains a new alias; the existing invocation is the one
      documented.
