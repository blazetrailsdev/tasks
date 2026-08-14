---
title: "Write down what 100% test compare means, and what may and may not be excluded"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activerecord"
  - "activesupport"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6507
claim: "2026-08-14T02:57:06Z"
assignee: "widen-assertion-report-packages-and-seed-mark"
blocked-by: null
closed-reason: null
---

## Context

Two definitions in this RFC are load-bearing and currently live only in this
README: (1) 100% means name parity **and** assertion parity, not name-matching
only; (2) a test file may leave a denominator only when the trails surface does
not exist and is not intended to — the `migration/compatibility_test.rb` case
(PR #5070, closed unmerged) — never because the surface exists and someone
believes users won't use it, which is how the fixtures row
(`scripts/parity/unported-files/unscoped.ts:77-99`, 172 AR tests) went stale
while `packages/activerecord/src/fixtures.ts` shipped and CLAUDE.md named
`fixtures({ … })` the canonical test surface.

`CONTRIBUTING.md` already carries the methodology for the other gates (the
"row count is the debt metric" section for the call baseline, the `@noRailsEquivalent`
receipt rule). The unported registry's own growth is the counter-example that
motivates writing this down: 18 entries in May 2026 → ~200 in August, per
`docs/infrastructure/parity-convergence-forecast.md` Part 1.

## Acceptance criteria

- `CONTRIBUTING.md` gains a short section stating the test-gate definition of
  done (name parity + assertion parity + `skipped = 0`) and the single admissible
  reason for a new `unported-files` row, with the surface-exists test spelled
  out and both worked examples cited.
- It states that a `pending`/`it.skip` stub is not a pass (they subtract at
  `scripts/test-compare/compare.ts:894-895`) and that a genuinely unportable
  Rails case gets a case-level `tests:` exclusion with a reason, never a
  whole-file row.
- It points at `pnpm parity:test:closure` for the activesupport in/out question.
- Docs-only; no code, no registry edits.
