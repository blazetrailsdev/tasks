---
title: "ci-actioncable-only-routes-to-scoped-comparison"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps:
  - enroll-actioncable-in-compare-tooling-and-parity-gates
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9206 generalized the thor comparison into `scripts/ci/scoped-comparison.sh <package>` and the `rails-comparison-scoped` job (`.github/workflows/ci.yml`, env `SCOPED_PACKAGE` / `SCOPED_SOURCE`). It does not route `actioncable_only` diffs there yet. actioncable has no vendored lib path (`pnpm vendor:fetch --print-lib-paths` has no `actioncable` key), so every `--package actioncable` gate refuses it, and the script exits 1 on an unenrolled package. Until enrollment an actioncable-only diff runs the full `rails-comparison`, as review on trails#9206 asked.

## Acceptance criteria

- [ ] `rails-comparison-scoped` runs when `thor_only || actioncable_only`; `SCOPED_PACKAGE` is `thor` / `actioncable` and `SCOPED_SOURCE` is `thor` / `rails`.
- [ ] `rails-comparison` skips under either flag; the `ci` aggregate accepts each skip only on its own side (`rails-comparison` and `rails-comparison-scoped` arms).
- [ ] The "keeps the full comparison for an actioncable-only diff until actioncable is enrolled" test in `scripts/ci-suite-coverage.test.ts` is replaced by one asserting the scoped routing, and a seeded actioncable regression reds the scoped job.
