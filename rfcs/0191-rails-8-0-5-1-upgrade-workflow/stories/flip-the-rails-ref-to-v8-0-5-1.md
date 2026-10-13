---
title: "Flip the rails ref to v8.0.5.1: lockfile, seeded ledger, recite, stale deletions, regenerated artifacts"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: flip
packages:
  [
    scripts,
    arel,
    activemodel,
    activerecord,
    activesupport,
    actionpack,
    actionview,
    activejob,
    trailties,
  ]
deps:
  [
    retake-the-body-pin-floor-at-the-last-8-0-2-commit,
    bump-dry-run-runs-the-gates-against-a-candidate-ref,
    bump-history-is-recorded-in-the-stats-db,
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3 "What the flip PR contains", and vendor/README.md § "Upgrading a
source (bumping `ref`)" steps 3 to 5. Target: `rails` `v8.0.5.1`,
`beef74d4cebf42a01cd1df79e9de00df725b64fd`, tagged 2026-07-29. This PR is
mechanical throughout and ports nothing.

Measured on 2026-10-13: 141 pins DRIFT and 12 go STALE in 82 Ruby files, and
ten gates go red without the ledger. 16 unpinned pairs also change, so the
seed after the floor is retaken is about 169 pair rows.

## Acceptance criteria

One PR from `main`, in separate commits:

- [ ] `pnpm parity:bump:dry-run --source rails --ref v8.0.5.1` is run and its
      report committed under `scripts/parity/bump-ledger/reports/`.
- [ ] `ref: "v8.0.5.1"` at `vendor/sources.ts:78`, and
      `pnpm vendor:fetch --source rails` re-locks `vendor/sources.lock.json`
      to the SHA above.
- [ ] The ledger for `rails` is seeded from the dry run, and the ledger gate
      confirms the seed.
- [ ] `pnpm vendor:recite` in its own commit (103 citations in 47 files on
      2026-10-13). The list from `pnpm vendor:recite --check`, taken before
      the rewrite, is attached to
      `reread-the-recited-rails-citations-against-v8-0-5-1`.
- [ ] Rows and receipts the bump makes stale on pairs outside the ledger are
      deleted by hand and the marks tightened with the `:tighten` scripts.
      Those on ledgered pairs are left for the burn-down. No `--write`, no
      reseed.
- [ ] Regenerated and committed: `pnpm rails-privates:manifest`, the
      deprecation manifest, `pnpm parity:api:conventions`, the ESLint exclude
      baselines, and `scripts/parity/pipeline/schema/ruby/Gemfile` with its
      lockfile.
- [ ] `MAJOR` / `MINOR` / `TINY` / `PRE` in each package's `gem-version.ts`
      and `VERSION` in `packages/actionpack/src/action-dispatch/index.ts` read
      what `gem_version.rb` states at `v8.0.5.1`, with the tests that assert
      them.
- [ ] If `record-the-mirrored-ref-in-each-package` has merged, its script is
      re-run and the `mirrors` fields read `v8.0.5.1` with the new SHA.
- [ ] The PR is rebased onto a `main` commit whose CI run is green and is
      merged with nothing landing in between, so its parent can be tagged.
- [ ] Every CI job is green. Each gate the dry run listed as "not exercised"
      is recorded in the PR body as green, mechanically fixed, or red, with
      what fixed it. A red on a unit outside the ledger is fixed here if the
      fix is mechanical; otherwise the PR stops and the gap is filed as a
      tooling story in this RFC.
- [ ] The PR body gives the ledger row count per package and the
      `parity:api` / `parity:test` rows before and after.

## Definition of done

Not closed by: a baseline, mark or exclude row that is wider than on `main`;
a re-pin of a drifted pair; a skipped or `continue-on-error` job.

## Notes

The LOC ceiling counts the hand edits. The recite commit, regenerated
manifests, the report and the ledger file are generated; say so in the PR
body. Announce the merge: every open PR that touches `body-pins.json` must
rebase. `v8.0.5.1` is a four-segment version: check `gem_version.rb` for how
Rails spells the fourth segment before writing the constants.
