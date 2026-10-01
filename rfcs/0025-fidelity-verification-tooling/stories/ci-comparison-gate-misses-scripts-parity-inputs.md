---
title: "CI: a scripts/parity-only diff (conventions.ts, unported-files) skips Rails API/Test Comparison"
status: draft
updated: 2026-10-01
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`COMPARISON_RE` (`.github/workflows/ci.yml`, the `changes` job's `filter` step) decides `comparison_affected`. It matches `packages/`, `scripts/(api|test|fixtures|schema)-compare/`, five named manifest builders, `vendor/`, `docs/ruby-ts-conventions.md` and `eslint/rails-deprecated-methods.json`. It does not match `scripts/parity/`, and `INFRA_CARVEOUT_RE` carves `scripts/parity/` out of the infra sweep, so a diff confined to `scripts/parity/` sets `comparison_affected=false` and neither comparison job runs.

Two files under `scripts/parity/` are inputs to the comparison:

- `scripts/parity/conventions.ts` — the Ruby→TS name and path rules `parity:api` matches on (`SKIP_GROUPS`, `PATH_SEGMENT_ALIASES`, `RUBY_FILE_TS_OVERRIDES`), and the source `scripts/parity/conventions-doc.ts --check` regenerates `docs/ruby-ts-conventions.md` from.
- `scripts/parity/unported-files/*.ts` — read by `scripts/test-compare/compare.ts` (`isTestFileUnported`, `isTestCaseUnported`).

The gate reference in `scripts/ci-suite-coverage.test.ts` (the `comparison_affected` section, the NOTE on `scripts/parity/conventions.ts`) says "the scripts/api-compare/ clause keeps that drift check gated on". That is not true for a diff that touches only `scripts/parity/conventions.ts`: the path does not match the `scripts/api-compare/` clause. Checked while implementing trails#8337 by matching both paths against the regex.

The same hole affects the thor-only path set: `scripts/ci/thor-only.sh` lists `scripts/parity/unported-files/thor.ts`, so a diff of that file alone is `thor_only=true` with `comparison_affected=false`, and `rails-comparison-thor` skips.

## Acceptance criteria

- [ ] A diff confined to `scripts/parity/conventions.ts`, or to a file under `scripts/parity/unported-files/`, sets `comparison_affected=true`.
- [ ] `scripts/ci-suite-coverage.test.ts` asserts both through `gateRunner`, and the gate reference's NOTE is corrected.
- [ ] The rest of `scripts/parity/` (`pipeline/`, `lint-legacy-script-names.ts`, …) keeps its current gating unless it is shown to feed the comparison.
- [ ] The `filter` step stays under GitHub's inline-script size limit (see `shrink-changes-job-filter-script-headroom`).
