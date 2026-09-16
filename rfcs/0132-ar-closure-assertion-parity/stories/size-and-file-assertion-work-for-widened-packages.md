---
title: "Size the newly measured assertion debt and file its burndown stories"
status: claimed
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: enforcement
packages:
  - "activesupport"
  - "activemodel"
  - "date"
  - "i18n"
deps:
  - "widen-assertion-report-packages-and-seed-mark"
deps-rfc: []
est-loc: 160
priority: 3
pr: null
claim: "2026-09-16T14:32:47Z"
assignee: "size-and-file-assertion-work-for-widened-packages"
blocked-by: null
closed-reason: null
---

## Context

`widen-assertion-report-packages-and-seed-mark` turns on assertion measurement
for activesupport, activemodel, date and i18n. Its output is a number nobody has
seen yet, so this RFC deliberately does not guess at its story breakdown up
front — that would be exactly the "token story appended to the plan" failure
mode. This story converts the measurement into scheduled work using the same
method the activerecord side already used: cluster by Rails source area, one
story per coherent surface, each a named file list with a divergence budget
sized to the PR ceiling.

Reference for the shape: this RFC's 33 `assertions-*` stories, each carrying a
per-file `count / kind / value` table read from
`pnpm parity:test -- --package activerecord --assertions`, and the burn method
in their Context sections (`scripts/test-compare/assertion-kinds.ts` for the
kind mapping, `--missing` for the per-test `rails N vs trails M` lines).

## Acceptance criteria

- Every package newly covered by the widened `ASSERTION_REPORT_PACKAGES` has its
  assertion debt broken into stories filed against this RFC with
  `pnpm tasks new`, each with a per-file table, an `--est-loc`, and
  non-overlapping files.
- Files whose divergences are structural rather than portable (an async surface
  needing `await expect(...)`, a Ruby-only value protocol) are called out per
  file with the reason, not swept into a porting story.
- The story bodies name the measured numbers, so the RFC's "Done means" is
  checkable without re-deriving them.
- **Every story this one files is added to
  `flip-assertion-mismatch-gate-to-hard-zero`'s `deps`** (`pnpm tasks set-deps
flip-assertion-mismatch-gate-to-hard-zero <csv>`, which re-checks references
  and cycles) **before this story closes.** Without that edit the flip becomes
  `ready` as soon as sizing finishes but before any widened-package burndown has
  landed, and the RFC's Done criteria — 0 assertion mismatches for activesupport,
  activemodel, date and i18n — would not be enforced by the queue.
- Docs/tracking only — no production or test-source changes in this PR.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
