---
title: "rails-test-name-parity-rollout-actionview"
status: draft
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-test-name-parity` (PR #7131) is a per-`it()` only-shrink
ratchet over TS-only tests sitting in Rails-named test files. Enrollment is four
registrations that must stay in sync:

- `PACKAGE_DIRS` in `scripts/build-rails-test-names-manifest.ts`
- `ENROLLED` in `scripts/tighten-rails-test-name-parity.ts`
- the rule's `files` block in `eslint.config.mjs`
- the `Rails test-name parity ratchet` step in `.github/workflows/ci.yml`

Enrolled so far: `arel` (#7125/#7131), `date` (#7155), and `did-you-mean` +
`i18n` (both seeded to nothing, since their `parity:test` extra counts were 0).

`actionview` has 70 TS-only tests as of 2026-08-28, so it seeds to a real mark and then
burns down.

## Acceptance criteria

- `actionview` is added to all four registrations, and its mark is seeded with
  `pnpm tsx scripts/tighten-rails-test-name-parity.ts --seed`.
- Each TS-only test moves into the file's `.trails.test.ts` twin (the shape
  #7125 used for arel's 297), narrowing the mark with
  `pnpm parity:test:names:tighten` — never widening it.
- No test renamed; `pnpm parity:test` percentages unchanged.
- Split across as many PRs as the 700 LOC ceiling needs.
