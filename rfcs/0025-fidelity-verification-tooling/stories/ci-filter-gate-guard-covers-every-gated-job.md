---
title: "Extend the CI filter/gate drift guard past unit-tests to every gated job"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5424 found that `.github/workflows/ci.yml` listed `eslint/` as a vitest
path filter in a job that no gate would ever fire for: `unit-tests` is gated on
`unit_tests_affected`, computed from `UNIT_TESTS_PKGS_RE`, which did not match
`eslint/`. A filter in a gated job is dead for any PR confined to the tree it
names — the suite is skipped exactly when it is the thing that changed.

That PR fixed the one instance and added a guard,
`scripts/ci-suite-coverage.test.ts` → "matches every unit-tests filter against
the gate that runs the job", which slices the `unit-tests:` block out of
ci.yml, extracts `UNIT_TESTS_PKGS_RE`, and asserts each filter is matched.

The guard is scoped to that ONE job. Every other gated vitest job in ci.yml can
carry the same dead-filter hole undetected: leaf-tests (`rack_affected`,
`av_affected`, `tse_compiler_affected`), the activerecord jobs
(`activerecord_affected`), trailties, actionpack, trails-tsc, rails-comparison
(`comparison_affected`), and the website job. None of their filter lists is
checked against the regex that decides whether the job runs.

## Acceptance criteria

- Generalize the guard from the hardcoded `unit-tests:` slice to every gated
  job in ci.yml: pair each job's vitest path filters with the `*_affected`
  gate in its `if:` and the `*_PKGS_RE` / `*_RE` that computes it.
- Every filter must be matched by its own job's gate, or be listed with a
  reason (the schema-compare shape — a suite that deliberately rides another
  job's gate — is the known legitimate exception).
- Prove it bites: dropping a tree from one gate regex must fail the test,
  naming the job and the filter.
- Fix whatever real holes the generalized guard surfaces, or file them if the
  fix is larger than this story.
