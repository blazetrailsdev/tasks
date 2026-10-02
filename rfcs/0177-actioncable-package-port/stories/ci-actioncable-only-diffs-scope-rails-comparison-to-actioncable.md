---
title: "CI: an actioncable-only diff extracts and compares only actioncable"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The comparison job is the long pole for a single-package diff.
**Rails API/Test Comparison** (`rails-comparison`,
`.github/workflows/ci.yml:1639`) fetches and extracts every vendored source
and runs every ratchet over every package.
`0171/ci-thor-only-diffs-scope-rails-comparison-to-thor` (done, trails#8337)
added a scoped twin for Thor: the `rails-comparison-thor` job
(`ci.yml:2056-2082`), which runs when `thor_only` is true, fetches one
source (`pnpm vendor:fetch --source thor`) and runs
`scripts/ci/thor-comparison.sh`. The full job is skipped on the other side
of the flag (`:1645`), and the aggregator accepts each job's skip only on its
own side (`:2306`, `:2452`).

This story generalizes that twin to take a package, and adds actioncable to
the packages it serves. It is a root, beside
`ci-actioncable-only-diffs-run-minimal-test-lanes`, which provides the
`actioncable_only` flag this job is conditioned on; the two land in either
order, and the job is inert until the flag exists.

Under `actioncable_only`:

- restore the vendor cache and fetch the `rails` source only (Action Cable is
  a package of the `rails` source in `vendor/sources.ts`, not a source of
  its own, so `--source rails` is the narrowest fetch);
- extract only actioncable: `LIB_PATHS_JSON` / `TEST_PATHS_JSON` filtered
  to the one package, which is how this RFC's own measurements were taken;
- run `compare.ts --package actioncable` and `parity:test` for the
  actioncable block;
- run each ratchet in its per-package mode where it has one. A ratchet that
  only reads the global artifact either gains a per-package mode, filtering
  the committed marks to the actioncable rows so no other package reads as
  STALE, or keeps running unscoped. trails#8337 made that call per step for
  thor; reuse each decision and record any that differ.

**Proving it.** The package does not exist when this story is claimed. The
generalized script is proven on thor (its result must not change) and by
`ci-suite-coverage.test.ts` scenarios with synthetic actioncable diffs. The
end-to-end proof, a seeded actioncable regression that reds the scoped job, is
an acceptance criterion of
`enroll-actioncable-in-compare-tooling-and-parity-gates`, which depends on
this story.

## Fidelity traps (predicted at authoring)

- [ ] **Partial artifacts vs global ratchets.** A ratchet fed an artifact that holds only actioncable rows must not read every other package's missing rows as "converged, tighten". That is the STALE-row failure CLAUDE.md warns about. Every scoped ratchet asserts that its artifact's package set matches its `--package`.
- [ ] **Rowless and zero marks.** actioncable is in `ROWLESS_PACKAGES` and has 0 in every mark. A scoped gate must still fail on a new extra name or a new mismatch; "no row for this package" is the pass condition, not a reason to skip the gate.
- [ ] **Activerecord-only steps** (`receipt-audit --package activerecord --gate` and the like) are skipped under `actioncable_only`, as under `thor_only`.
- [ ] **The vendor cache is restore-only in the scoped job** (`ci.yml:2073-2077`). A cache miss must fetch, not fail.
- [ ] **`rails-private-jsdoc` needs the manifest** built from `rails-api.json`; a scoped extraction produces a scoped manifest, so the lint must run over `packages/actioncable` only.
- [ ] **One job or two.** A second copy of the job per package doubles the aggregator arms. Prefer one scoped job keyed by a `scoped_package` value; if GitHub's `if:` expressions force two jobs, say why in the PR.
- [ ] **A real `packages/actioncable` directory**, unlike thor's pseudo-package (`PACKAGE_DIR_OVERRIDES` / `PACKAGE_SRC_SUBDIR`). The generalized script must handle both shapes.

## Acceptance criteria

- [ ] One script under `scripts/ci/` runs the scoped comparison for a named package; for thor its steps and result are unchanged.
- [ ] With `actioncable_only` true, the scoped job runs and the full `rails-comparison` job is skipped; with it false, the reverse; the aggregator accepts each skip only on its own side.
- [ ] Each gate step is either scoped to the package or listed as unscoped with the reason, in the script.
- [ ] `scripts/ci-suite-coverage.test.ts` covers the actioncable scenarios, and a non-actioncable diff runs the comparison job exactly as today.

## Definition of done

A scoped job that skips the gates it cannot scope, or one that passes because the package has no rows, does not close this story.

## Verification

```bash
pnpm vitest run scripts/ci-suite-coverage.test.ts scripts/api-compare scripts/test-compare
bash scripts/ci/thor-comparison.sh   # or its generalized successor, for thor: unchanged result
```
