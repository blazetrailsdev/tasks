---
title: "CI's changed-files lint scope cannot see a cross-file type-driven lint break"
status: ready
updated: 2026-08-22
rfc: "0061-ci-failures"
cluster: null
packages: []
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

# CI's changed-files lint scope cannot see a cross-file type-driven lint break

## Context

`pnpm lint` was red on `main` with a `@typescript-eslint/no-unnecessary-type-assertion`
error in `postgresql-adapter.exec-query.test.ts` while CI was green
(the `lint-red-on-main-unnecessary-type-assertion-pg-exec-query` story, closed
by #6844 / #6852).

The cause is structural, not a one-off. CI's Lint job lints only the files a PR
CHANGED (`.github/workflows/ci.yml:313-323`, reading the `lint_files` filter
output built at `:179-188`); the whole tree is linted only when a rule INPUT
changes (`LINT_ALL_RE`, ci.yml:136 — `eslint.config.mjs`, `eslint/`, the eslint
version pin, `vendor/`, the stubbed-DDL list).

Type-aware rules break that assumption. `no-unnecessary-type-assertion` (and
every other rule reading the type checker) depends on declarations in OTHER
files, so narrowing a return type in `postgresql-adapter.ts` — which #6663 did —
makes an assertion in a test file redundant without that test file appearing in
any PR's changed set. It is then never re-linted, CI stays green, and `main`
carries a lint error that costs every agent a false positive on the pre-PR
checklist.

The gap is invisible in the other direction too: nothing currently reports that
`pnpm lint` on `main` disagrees with the last Lint job that ran.

## Converged shape

Options, cheapest first — pick one, do not do all three:

1. A scheduled (nightly / on-merge-to-main) full-tree `pnpm lint` that opens an
   RFC 0061 story or fails loudly when `main` is red. Cheapest, catches every
   class, tolerates the lag.
2. Widen `LINT_ALL_RE` to force a full-tree lint when a `.ts` file OTHER than a
   test changes — far too broad, listed only to be rejected explicitly.
3. Lint the changed files' type-level dependents. Correct but needs a reverse
   import graph nothing in the repo builds today.

Option 1 is the recommendation: this is a low-frequency, high-annoyance class,
and the lag between the break landing and the report is not what costs time —
the silent red on `main` is.

## Acceptance criteria

- [ ] A red `pnpm lint` on `main` produces a signal without a human noticing it
      locally first.
- [ ] The signal names the file and rule, so the fix is a one-liner rather than
      a re-derivation.
- [ ] The per-PR Lint job's changed-files scope is unchanged (a full-tree lint on
      every PR is explicitly NOT the fix — CI runner cost is the reason the
      scope exists).
