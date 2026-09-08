---
title: "rails-test-name-parity-actionview-burndown-remainder"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
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

`rails-test-name-parity-rollout-actionview` enrolled `actionview` in the
`blazetrails/rails-test-name-parity` ratchet (all four registrations) and seeded
its mark at 72 TS-only tests across 8 files. That PR burnt down the three
smallest files — `template/date-helper.test.ts` (2),
`template/javascript-helper.test.ts` (1) and
`template/output-safety-helper.test.ts` (2) — leaving the mark at 67 across 5
files. (`pnpm parity:test:names:tighten` prints REPO-WIDE totals across every
enrolled package, not per-package ones; the 79/74 figures first recorded here
were those totals, which already included 7 rows from `arel`/`date`. The
per-file rows below are the authority.) The rest did not fit under the 700 LOC ceiling.

Remaining, from `eslint/rails-test-name-parity-mark.json`:

- `packages/actionview/src/buffers.test.ts` — 36
- `packages/actionview/src/template/text-helper.test.ts` — 16
- `packages/actionview/src/template/tag-helper.test.ts` — 9
- `packages/actionview/src/template/tse-util.test.ts` — 5
- `packages/actionview/src/template/sanitize-helper.test.ts` — 1

`buffers.test.ts` has no `.trails.test.ts` twin yet; the other four either have
one or need one created, the shape #7125 used for arel's 297.

## Acceptance criteria

- [ ] Each remaining TS-only test moves into its file's `.trails.test.ts` twin,
      unrenamed, narrowing the mark with `pnpm parity:test:names:tighten` —
      never widening it.
- [ ] `pnpm parity:test` percentages unchanged.
- [ ] Split across as many PRs as the 700 LOC ceiling needs; the mark reaches 0
      for `actionview`.
