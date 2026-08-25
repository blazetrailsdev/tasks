---
title: "Scope pnpm lint to changed files instead of the whole tree"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6185
claim: "2026-08-07T17:29:47Z"
assignee: "activerecord-unrouted-privates-tasks-and-migration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the pre-ready CI audit shipped in #5931 (report:
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/pre-ready-ci-deferral-20260802T231228Z.md`).

`lint` (`ci.yml:438-447`) runs `pnpm lint` over the whole tree on every push of
every non-docs-only PR. Measured **141-156s** across four recent runs — the
second-longest non-test job in the pre-ready phase, behind only `sqlite-tests`.

This is not a deferral candidate: reviewers here rely on lint being clean before
review, and the repo's custom rules (`eslint/rails-private-jsdoc`,
`no-raw-control-bytes`, the deprecated-method manifest) are fidelity signal. The
win is scoping instead of deferring.

The `changes` job already computes a changed-file list for exactly this shape:
`prettier_files` (`ci.yml:~285-300`), including the `__ALL__` fallback when
config or the formatter version changes. ESLint could consume the same list the
same way.

Two things to get right, or this trades runner time for missed lint:

- Rule scope. Some rules are cross-file (drift guards between a config and its
  consumer, e.g. `eslint/rails-private-jsdoc.config.test.mjs`). Linting only
  changed files can miss a violation introduced in an unchanged file by a
  changed one. Enumerate which rules are file-local before scoping.
- The `__ALL__` fallback must trigger on `eslint.config.mjs`, anything under
  `eslint/`, and the eslint version pin in `pnpm-lock.yaml` — mirroring the
  Prettier fallback's reasoning.

## Acceptance criteria

- `lint` consumes a changed-files list from `changes` rather than linting the
  whole tree, with an `__ALL__` fallback on config/rule/version changes.
- `scripts/ci-suite-coverage.test.ts` pins the fallback triggers, in the shape
  the existing gate tests use.
- Measured before/after wall time recorded in the story.

## Measured CI wall time (added by `measure-scoped-lint-on-ci-and-tune-the-all-fallback`)

Job name is `Lint` (`ci.yml`), measured from the GitHub Actions jobs API. The
cutover is visible in run history: everything at or before run `31207704812`
predates the scoping, everything after takes the scoped path unless the diff
hits `LINT_ALL_RE`.

| Path                             | Runs                                                   | Job wall time       | `pnpm lint` / `ESLint` step |
| -------------------------------- | ------------------------------------------------------ | ------------------- | --------------------------- |
| Pre-scoping (whole tree)         | `31207293955`, `31207285341`                           | 141s, 152s          | —                           |
| `__ALL__` fallback, post-scoping | `31207704812` (merge of #6185, touches `package.json`) | 147s                | 123s                        |
| Scoped                           | 18 runs `31208xxx`–`31212xxx`                          | 28-52s, median ~33s | **8s**                      |

Fixed job overhead is ~21s of that (`Set up job` 1-2s, checkout 2s,
`setup-pnpm` 9s, `pnpm install` 9s), so the scoped run is overhead-dominated:
33s job for an 8s lint.

### `prelint:files` does not need hoisting

The whole scoped `ESLint` step — `prelint:files` (five manifest rebuilds) plus
the `xargs` ESLint batches — is **8s** on CI (run `31212240582`, step 5), vs
123s for `pnpm lint` on the `__ALL__` path. The hook is not a material share of
the scoped run at any plausible batch count, so hoisting it to its own workflow
step buys nothing and is not done.

### `__ALL__` hit rate: 1/20 (5%)

`LINT_ALL_RE` matched over the diffs of the 20 most recently merged PRs
(#6170-#6190): only **#6185** fell back, on `package.json` — and that PR was the
scoping change itself. `pnpm-lock.yaml` did not trigger a single fallback in the
sample, because dependency bumps are rare relative to port work.

So `package.json`/`pnpm-lock.yaml` do **not** dominate the fallback rate, and
`LINT_ALL_RE` is **not** narrowed to the eslint version pin: narrowing would
trade a real correctness property (a dependency bump can move typed-rule
results tree-wide) for ~0 runner minutes. Revisit if the hit rate climbs.
