---
title: "Rehearsal: flip the rails ref to v8.0.5.1 with a seeded ledger"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: rehearsal
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

RFC § 1 "Two flips" (owner ruling of 2026-10-13 on Open question 4). Before
the 8.1 flip, the whole procedure is run once on the last 8.0 release,
`v8.0.5.1` (tagged 2026-07-29). Between `v8.0.2` and `v8.0.5.1`, 169 method
bodies change and 46 defs are added: activerecord 65, activesupport 39,
actionview 18, arel 14, actiondispatch 14, trailties 11, actioncontroller 3,
activejob 3, activemodel 1, abstractcontroller 1. 132 of the 169 bodies are
byte-identical in `v8.1.4`, and 45 of the 46 added defs exist there.

Those are def-level counts from the extracted manifests. No gate has been run
against `v8.0.5.1`; the dry run gives its pin drift (expected near 130) and
its test changes.

## Acceptance criteria

- [ ] `pnpm parity:bump:dry-run --source rails --ref v8.0.5.1` is run and its
      report committed under `scripts/parity/bump-ledger/`, so the stats sync
      imports it.
- [ ] The PR has the same commits, in the same order, as RFC § 3 "What the
      flip PR contains", with `ref: "v8.0.5.1"`: lockfile, seeded ledger,
      `vendor:recite`, stale deletions on pairs outside the ledger,
      regenerated artifacts, version constants at 8.0.5.1, `mirrors` fields.
- [ ] It is rebased onto a green `main` and merged with nothing in between.
- [ ] Every CI job is green. Each gate the dry run listed as "not exercised"
      is recorded in the PR body as green, mechanically fixed, or red, with
      what fixed it. A red there stops the PR and becomes a tooling story.
- [ ] `v8.0.5.1`'s `Gemfile.lock` is read against `sources.lock.json`. No
      dependent source is bumped in the rehearsal; any that the lock moves is
      noted for `size-and-sequence-the-dependent-source-bumps`.

## Definition of done

Same as the 8.1.4 flip: no widened baseline, mark or exclude row, no re-pin of
a drifted pair, no skipped job.
