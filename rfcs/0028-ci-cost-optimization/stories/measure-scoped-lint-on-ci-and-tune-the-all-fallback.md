---
title: "Measure the scoped lint job on CI and tune LINT_ALL_RE / prelint hoisting"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6195
claim: "2026-08-07T19:28:44Z"
assignee: "execute-migration-in-transaction-split-into-invented-run-migration"
blocked-by: null
closed-reason: null
---

## Context

Filed from #6185, where the `lint` job was scoped from `eslint .` to a
changed-file list (`scope-lint-to-changed-files`, RFC 0028). The story required
a before/after measurement and got one **locally** — `pnpm lint` 3m28s over the
whole tree vs 15s for a two-file scoped run on the same machine — but the
story's real baseline is the CI number: 141-156s measured across four runs in
the pre-ready CI audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/pre-ready-ci-deferral-20260802T231228Z.md`).

The post-change CI number was never recorded, because the scoped path only
exercises on a PR whose diff misses `LINT_ALL_RE` — and #6185 itself touched
`eslint.config.mjs`'s neighbours (`package.json`), so every one of its own runs
took the `__ALL__` fallback. The saving is therefore projected, not measured.

Two things worth confirming with real numbers:

1. **The scoped-path wall time on CI.** Includes the `prelint:files` hook,
   which rebuilds five manifests (`build-rails-privates-manifest`,
   `-error-`, `-tosql-`, `-file-structure-`, `test-deps/rails-test-deps`)
   before ESLint starts. Locally that hook is ~10-20s and it runs once per
   `xargs` batch — on a PR with enough changed files to split the batch it runs
   more than once. If the hook dominates, the win is much smaller than the
   local 15s suggests and the fix is to hoist it to its own step.
2. **How often the `__ALL__` fallback actually fires.** `LINT_ALL_RE` includes
   `package.json` and `pnpm-lock.yaml`; any PR touching a dependency takes the
   full-tree path. If that is most PRs, the scoping buys little and the regex
   should be narrowed to the eslint pin specifically rather than the whole
   manifest.

## Acceptance criteria

- Scoped-path and `__ALL__`-path `lint` durations recorded from real CI runs,
  written into the `scope-lint-to-changed-files` story file.
- Fallback hit rate sampled over ~20 recent merged PRs.
- If `prelint:files` is a material share of the scoped run, hoist it to its own
  workflow step so it runs once regardless of `xargs` batching.
- If `package.json`/`pnpm-lock.yaml` dominate the fallback rate, narrow
  `LINT_ALL_RE` to the eslint version pin and pin the narrowing in
  `scripts/ci-suite-coverage.test.ts`.
