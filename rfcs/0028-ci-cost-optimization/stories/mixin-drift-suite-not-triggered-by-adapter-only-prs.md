---
title: "mixin-drift-suite-not-triggered-by-adapter-only-prs"
status: ready
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
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

`scripts/mixin-declaration-drift.test.ts` (PR #5863) guards the
declaration-merged adapter interfaces in
`packages/activerecord/src/connection-adapters/`, but it lives in the
`scripts/` tree, so it runs only in the **unit-tests** job. That job is gated on
`UNIT_TESTS_PKGS_RE` (`.github/workflows/ci.yml:190`), which does not match
`packages/activerecord/`. An activerecord-only PR — exactly the PR that can
introduce mixin/interface drift — never runs the suite; the drift surfaces on
some later PR that happens to touch a gated tree.

Both obvious homes were rejected while writing #5863:
`packages/activerecord/scripts/` runs in the AR lane but sits outside that
package's `tsconfig` `include` (`packages/activerecord/tsconfig.json:8`), so the
lint would stop being typechecked; adding `packages/activerecord/` to
`UNIT_TESTS_PKGS_RE` runs the whole ~10.5k-test unit job on every AR PR.

A narrower gate — the adapter files the `PAIRS` list actually reads — is
probably the right shape.

## Acceptance criteria

- A change confined to `packages/activerecord/src/connection-adapters/` runs
  the mixin-declaration-drift suite.
- The lint module stays typechecked.
- The unit job is not newly triggered by unrelated activerecord changes.
- `scripts/ci-suite-coverage.test.ts` still passes.
