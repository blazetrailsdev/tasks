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
