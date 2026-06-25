---
title: "AR test harness runs partial_inserts=false (load_defaults 7.0) vs Rails test-suite default true"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - partial-inserts-dirty-baseline-db-column-default
  - partial-inserts-composite-pk-key-retention
  - partial-inserts-optimistic-locking-initial-value
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: "2026-06-20T22:37:27Z"
assignee: "ar-test-suite-partial-inserts-ambient-divergence"
blocked-by: null
---

> **CLOSED 2026-06-25 — audit complete.** This was the audit/spike that codified the `restoreRailsTestPartialInserts` interim pattern and identified the systemic blockers. Audits are done-when-closed; the actual convergence work is owned by `partial-inserts-flip-ar-test-suite-ambient`.

## Context

Surfaced while porting `hot_compatibility_test.rb:25-57` (PR #3741). Rails' AR
test suite (`activerecord/test/cases/helper.rb`) does **not** call
`config.load_defaults`, so every ported test runs with the gem default
`partial_inserts = true` (`dirty.rb:50`). trails' harness, by contrast, calls
`loadDefaults("7.0")` in `packages/activerecord/src/test-setup-ar.ts` (RFC 0020),
which flips `partial_inserts = false` — matching a Rails 7.0 _app_, not Rails'
_test suite_.

Consequence: any ported test whose behavior depends on partial-insert column
selection diverges from how Rails runs it. `hot-compatibility.test.ts` had to
set `HotCompatibility.partialInserts = true` per-model to mirror the Rails-test
ambient (otherwise the post-`remove_column` INSERT references the dropped `bar`
column and raises). Other ported tests may silently rely on `false` and would
need auditing before any global flip.

This is the inverse of RFC 0020's intent (which correctly models a 7.0 app), so
it is a test-harness fidelity question, not an app-config one. Convergence
target: trails' AR test suite should reproduce Rails' test-suite ambient
(`partial_inserts = true`) rather than the 7.0-app default — OR each ported test
that needs the Rails ambient should set it explicitly and the divergence be
documented as intentional.

## Acceptance criteria

- [ ] Audit ported AR tests for implicit dependence on `partial_inserts`
      (insert column selection) and enumerate which rely on `false` vs `true`.
- [ ] Decide convergence: either flip the AR test-suite ambient to
      `partial_inserts = true` (matching Rails helper.rb) with per-test opt-outs
      where a test genuinely exercises the 7.0 path, or codify the per-test
      `partialInserts = true` override as the sanctioned pattern with a lint/doc.
- [ ] `test:compare` / `api:compare` delta non-negative after the change.
