---
title: "gate-virtualized-dx-on-i18n"
status: closed
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do on RFC closure: 0028-ci-cost-optimization is being closed at 71/77 and no other RFC owns CI job gating. The audit finding stands (virtualized-dx-tests' tsconfig pulls i18n, so the job should be gated on i18n paths); refile against a CI-cost successor RFC if job-gating cost becomes a problem again. Analysis is preserved in this story body and in scripts/ci-suite-coverage.test.ts."
---

## Context

Surfaced by the audit in `audit-virtualized-dx-and-leaf-gates-against-real-inputs`
(written up in `scripts/ci-suite-coverage.test.ts`, "AUDIT:
virtualized-dx-type-tests / trailties-tests / leaf-tests").

`packages/activerecord/virtualized-dx-tests/tsconfig.json` maps
`@blazetrails/i18n` to `packages/i18n/src/index.ts`, so
`pnpm test:types:virtualized` type-checks the DX patterns against real i18n
types. But the `virtualized-dx-type-tests` job gates on
`activerecord_affected || trails_tsc_affected` (`.github/workflows/ci.yml:481-484`),
and `packages/i18n/` is in neither `AR_PKGS_RE` (`ci.yml:103`) nor
`TRAILS_TSC_PKGS_RE` (`ci.yml:108`). An i18n-only PR therefore never runs the
suite that consumes its types.

The audit deliberately did not fix this: closing it _widens_ a gate (more job
executions), which is a cost decision separate from the audit's finding.

## Acceptance criteria

- Decide whether `packages/i18n/` should flip `virtualized-dx-type-tests` —
  either by adding it to the job's `if`, or by removing `@blazetrails/i18n`
  from the virtualized tsconfig's `paths` if nothing under
  `virtualized-dx-tests/` actually needs it.
- `scripts/ci-suite-coverage.test.ts` pins the resulting gate in both
  directions, as `db_adapter_affected` is pinned.
- The audit prose in that file is updated to reflect the resolution.
