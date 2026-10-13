---
title: "A bump dry run runs every parity gate against a candidate ref without moving the active one"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 2 "How the size was measured" and § 7. Scoping these bumps took a
hand-assembled dry run: `pnpm parity:api:drift --ref v8.1.4` extracts the
candidate's Ruby API to `scripts/api-compare/output/rails-api@v8.1.4.json`
(`scripts/api-compare/drift.ts:180-190`) but only diffs manifests. Its `ported`
flag counted 41 of activerecord's 307 changed methods where 388 body pins
drift, and there is no test-side report. The numbers the plan needed came from
merging the candidate's Rails packages over a copy of `output/rails-api.json`,
running each step of ci.yml's `rails-comparison` job against it, and running
`scripts/test-compare/extract-ruby-tests.rb` with `TEST_PATHS_JSON` pointed at
`vendor/rails/v8.1.4/`.

The body-pins gate hard-fails on DRIFT and on STALE
(`scripts/api-compare/lint-body-pins.ts:74-112`), so the first time anyone sees
these numbers today is a red `main`.

## Acceptance criteria

- [ ] `pnpm parity:bump:dry-run --source <name> --ref <tag>` fetches the
      candidate beside the active version if it is absent, extracts its Ruby
      API and test manifests into gitignored paths, and runs the gates against
      them. `vendor/sources.ts`, `vendor/sources.lock.json` and every committed
      baseline, mark and pin file are byte-identical afterwards.
- [ ] It runs every gating step of the `rails-comparison` job and reports each
      as green or red with its counts. A step it cannot exercise without the
      active version directory (rails-private lint, method-order lint,
      test-name ratchet, inlined-from citation spans, fixtures and models
      comparison, Schema Parity, Query Parity) is either exercised or listed
      under "not exercised" with the upstream count that predicts it. This
      settles the RFC's Open question 7.
- [ ] It writes a ledger seed: the DRIFT and STALE pairs keyed as body pins
      are, and the matched tests whose assertion signature or gate changed.
- [ ] It attributes every new call, call-argument, parameter, block, arm and
      extra-surface row to a seed row, and prints any it cannot attribute. For
      `rails` at `v8.0.5.1` on 2026-10-13 that residue was 2 call rows on
      unpinned pairs.
- [ ] It prints the per-package tables of RFC § 2 (files, defs, pins, tests).
- [ ] For `--source rails --ref v8.0.5.1` it reproduces 141 DRIFT and 12
      STALE, and for `--ref v8.1.4` 728 and 125, or the PR body explains each
      difference by commits merged since `25cc7a1876`.
- [ ] Unit tests cover the manifest merge and the attribution, in a
      `scripts/` test directory registered wherever a new one must be.

## Definition of done

A wrapper that bumps `ref`, runs the gates and reverts does not close this
story: the active version must never move.

## Notes

`parity:api:drift` stays; the dry run calls its extraction. The lints that
regenerate their artifact (`gate-regen.ts`) must be run with `--no-regen` or
they overwrite the merged manifest.
