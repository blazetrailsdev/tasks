---
title: "unit-tests-gate-misses-activerecord-importers"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5989
claim: "2026-08-03T16:44:44Z"
assignee: "unit-tests-gate-misses-activerecord-importers"
blocked-by: null
closed-reason: null
---

## Context

The `Unit Tests` job is gated on `unit_tests_affected`, which deliberately
excludes `packages/activerecord/` to keep the whole AR tree off that gate
(`.github/workflows/ci.yml:193`).

But two suites bundled into that job import activerecord source directly:

- `scripts/test-deps/adapter-graph-import-tdz.test.ts:18` imports
  `packages/activerecord/src/connection-adapters/abstract/schema-statements.js`
  (by design — it is the regression guard for the adapter-graph circular-init
  TDZ, and must enter the graph from outside the AR vitest project).
- `scripts/parity/query/node/*` spawns dump runners that resolve
  `@blazetrails/activerecord`.

So an activerecord-only change can break the `Unit Tests` job while the PR
that caused it reports green, and the break is only discovered on the next
push to `main`.

This is not hypothetical: it is exactly how the `_arConfig` TDZ
(`ReferenceError: Cannot access '_arConfig' before initialization`) reached
`main` and held `Unit Tests` red across 621f4cba / 65a3a44, fixed in #5647.
That fix's own PR runs all showed `Unit Tests: skipped`.

## Acceptance criteria

- An activerecord-only change that breaks
  `scripts/test-deps/adapter-graph-import-tdz.test.ts` fails CI on the PR
  that introduces it, not on the following push to `main`.
- The fix does not put the whole `packages/activerecord/` tree onto
  `unit_tests_affected` — the carve-out at ci.yml:193 exists for cost
  reasons and should be preserved. Options worth weighing: narrow the gate
  to the AR subpaths the bundled suites actually reach, or move the
  TDZ guard into a job already gated on activerecord changes (it must keep
  running outside the AR vitest project's setupFiles, which is what makes
  the entry-order reproduce).
- The rationale comment at ci.yml:181-193 is updated to state which
  activerecord paths feed the gate and why.

## Definition of done

- CI green; a deliberate local re-break of the TDZ guard is shown to fail an
  activerecord-only PR.

## Verification

- `pnpm vitest run scripts/test-deps`
