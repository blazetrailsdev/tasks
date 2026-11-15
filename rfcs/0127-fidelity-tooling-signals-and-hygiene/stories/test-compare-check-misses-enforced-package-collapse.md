---
title: "test:compare --check passes when an enforced package collapses to 0 matched"
status: draft
updated: 2026-11-15
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

From trails#10034 (activerecord moved to lib/ + test/) to trails#10116, test:compare
reported activerecord at 0/8997 matched, 0/361 files, 8828 misplaced on every merge,
and no gate went red. `PKG_SRC_DIRS.activerecord` was rooted at `test/` instead of
`test/cases/`, so every convention path missed its prefix.

activerecord is in `GATE_ENFORCED_PACKAGES`, but `--check`
(scripts/test-compare/compare.ts, `gateMismatchOffenders`) only fails on a non-zero
adapter-gate mismatch count. With zero tests matched, nothing is checked, so it passes.

## Shape

`--check` fails when an enforced package's matched count or mapped-files count drops
sharply against the base branch's artifact (or a committed floor). A wholesale
"everything misplaced" result is the signal of a root/path regression, not porting
progress.

## Acceptance

- A test where an enforced package scores 0 matched / all misplaced makes `--check` exit non-zero.
- Reverting #10116's root change makes CI red.
